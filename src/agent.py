import logging
import os
from dotenv import load_dotenv
import asyncio
import json
import aiohttp
from typing import Optional
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    cli,
    function_tool,
    RunContext,
    room_io,
    utils,
    ToolError,
)
from livekit.plugins import noise_cancellation, openai



logger = logging.getLogger("agent")

load_dotenv(os.path.join(os.path.dirname(__file__), "../.env.local"))


class Assistant(Agent):
    def __init__(self) -> None:
        # Load the prompt from ai_prompt.md
        prompt_path = os.path.join(os.path.dirname(__file__), "ai_prompt.md")
        with open(prompt_path, "r", encoding="utf-8") as f:
            instructions = f.read()

        super().__init__(
            instructions=instructions,
        )

    async def on_enter(self):
        await self.session.generate_reply(
            instructions="Greet the user and offer your assistance.",
            allow_interruptions=True,
        )
    
    @function_tool(name="get_solar_estimate")
    async def _http_tool_get_solar_estimate(
        self, context: RunContext, zip_code: float, monthly_bill: float, roof_type: Optional[str] = None, roof_age: Optional[float] = None, has_ev_plans: Optional[bool] = None, wants_battery: Optional[bool] = None
    ) -> str | None:
        """
        Calculates a rough solar system size estimate based on usage and home details.

        Args:
            zip_code: 
            monthly_bill: 
            roof_type: Accept either Shingles, Flat, Metal, Zinc, Wood Shakes
            roof_age: How long you have the roof
            has_ev_plans: If customer plan to own an Electric Vehicle
            wants_battery: 
        """

        context.disallow_interruptions()

        url = "https://kcalvin.myvnc.com/webhook-test/get_estimate"
        payload = {
            "zip_code": zip_code,
            "monthly_bill": monthly_bill,
            "roof_type": roof_type,
            "roof_age": roof_age,
            "has_ev_plans": has_ev_plans,
            "wants_battery": wants_battery,
        }

        try:
            session = utils.http_context.http_session()
            timeout = aiohttp.ClientTimeout(total=10)
            async with session.post(url, timeout=timeout, json=payload) as resp:
                if resp.status >= 400:
                    raise ToolError(f"error: HTTP {resp.status}")
                return await resp.text()
        except ToolError:
            raise
        except (aiohttp.ClientError, asyncio.TimeoutError) as e:
            raise ToolError(f"error: {e!s}") from e

server = AgentServer()

@server.rtc_session()
async def my_agent(ctx: JobContext):
    """
    Entry point for the agent.
    
    This agent requires the following metadata in the JobContext (JSON string):
    - user_id: Unique identifier for the user
    - user_name: Name of the user
    - user_phone: Phone number of the user (if applicable)
    """
    # Logging setup
    # Add any other context you want in all log entries here
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Set up the session with OpenAI Realtime Model
    session = AgentSession(
        llm=openai.realtime.RealtimeModel(
            voice="ballad",
        )
    )

    # Start the session, which initializes the voice pipeline and warms up the models
    await session.start(
        agent=Assistant(),
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: noise_cancellation.BVCTelephony()
                if params.participant.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                else noise_cancellation.BVC(),
            ),
        ),
    )

    # Join the room and connect to the user
    await ctx.connect()


if __name__ == "__main__":
    cli.run_app(server)
