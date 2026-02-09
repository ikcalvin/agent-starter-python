import logging
import os
from pathlib import Path
from dotenv import load_dotenv
import asyncio
import json
import aiohttp
from typing import Optional

# Resolve the directory containing this file (works reliably in containers)
SCRIPT_DIR = Path(__file__).parent.resolve()
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
    ToolError
)
from livekit.plugins import noise_cancellation, openai, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel


logger = logging.getLogger("agent")

load_dotenv(SCRIPT_DIR.parent / ".env.local")


class Assistant(Agent):
    def __init__(self) -> None:
        # Load the prompt from ai_prompt.md
        prompt_path = SCRIPT_DIR / "ai_prompt.md"
        with open(prompt_path, "r", encoding="utf-8") as f:
            instructions = f.read()

        super().__init__(
            instructions=instructions,
        )

    async def on_enter(self):
        await self.session.generate_reply(
            instructions="Greeting the user in English. Say exactly: 'Thanks for calling about solar for your home! I can give you a quick savings estimate in about two minutes. Sound good?'",
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
            roof_type: Accept either Composite, Concrete, Clay, Metal, Wood Shake, Other
            roof_age: How long you have the roof
            has_ev_plans: If customer plan to own an Electric Vehicle
            wants_battery: 
        """

        context.disallow_interruptions()

        url = "https://kcalvin.myvnc.com/webhook/get_estimate"
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

    @function_tool(name="save_lead")
    async def _http_tool_save_lead(
        self,
        context: RunContext,
        name: str,
        phone: str,
        email: str,
        street: str,
        city: str,
        state: str,
        zip_code: str,
        roof_type: str,
        monthly_bill: str,
        interest_battery: bool,
        interest_ev: bool,
        date_time: str,
    ) -> str | None:
        """
        Saves the lead information and books the consultation.

        Args:
            name: Customer's full name
            phone: Customer's 10-digit phone number
            email: Customer's email address
            street: Street address
            city: City
            state: State
            zip_code: ZIP code
            roof_type: Type of roof
            monthly_bill: Average monthly electric bill
            interest_battery: Whether the customer is interested in battery backup
            interest_ev: Whether the customer plans to get an EV
            date_time: Preferred date and time for the consultation in ISO 8601 format
        """
        context.disallow_interruptions()

        url = "https://kcalvin.myvnc.com/webhook/save_lead"
        payload = {
            "name": name,
            "phone": phone,
            "email": email,
            "street": street,
            "city": city,
            "state": state,
            "zip_code": zip_code,
            "roof_type": roof_type,
            "monthly_bill": monthly_bill,
            "interest_battery": interest_battery,
            "interest_ev": interest_ev,
            "date_time": date_time,
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

    @function_tool(name="end_call")
    async def _end_call(
        self,
        context: RunContext,
        reason: Optional[str] = None,
    ) -> str:
        """
        Ends the current voice call gracefully. Use this when the conversation is complete,
        the user wants to hang up, or when ending the call is appropriate.

        Args:
            reason: Optional reason for ending the call (e.g., "user requested", "consultation booked", "not interested")
        """
        logger.info(f"Ending call. Reason: {reason or 'No reason provided'}")
        
        # Shutdown the session gracefully, allowing any pending speech to complete
        await self.session.shutdown(reason=reason or "Call ended")
        
        return "Call ended successfully"

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
        llm="google/gemini-2.5-flash",
        stt="deepgram/nova-2",
        tts="deepgram/aura-2:athena",
        vad=silero.VAD.load(),
        turn_detection=silero.TurnDetection.load(),
            
        # llm=openai.realtime.RealtimeModel(
        #     voice="ballad",
        # )
    )

    # Start the session, which initializes the voice pipeline and warms up the models
    await session.start(
        agent=Assistant(),
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: (
                    noise_cancellation.BVCTelephony()
                    if params.participant.kind
                    == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                    else noise_cancellation.BVC()
                ),
            ),
        ),
    )

    # Join the room and connect to the user
    await ctx.connect()


if __name__ == "__main__":
    cli.run_app(server)
