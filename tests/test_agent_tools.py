import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import sys
import os

# Ensure src is in path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../src")))

from agent import Assistant
from livekit.agents import ToolError

@pytest.fixture
def agent():
    return Assistant()

@pytest.fixture
def run_context():
    return MagicMock()

@pytest.mark.asyncio
async def test_get_solar_estimate(agent, run_context):
    zip_code = 90210
    monthly_bill = 150.0
    roof_type = "Composite"
    roof_age = 10.0
    has_ev_plans = True
    wants_battery = False

    expected_payload = {
        "zip_code": zip_code,
        "monthly_bill": monthly_bill,
        "roof_type": roof_type,
        "roof_age": roof_age,
        "has_ev_plans": has_ev_plans,
        "wants_battery": wants_battery,
    }

    mock_response = AsyncMock()
    mock_response.status = 200
    mock_response.text.return_value = "Estimate received"
    
    # Context manager mock for session.post
    mock_post_ctx = AsyncMock()
    mock_post_ctx.__aenter__.return_value = mock_response
    mock_post_ctx.__aexit__.return_value = None

    mock_session = MagicMock()
    mock_session.post.return_value = mock_post_ctx

    with patch("livekit.agents.utils.http_context.http_session", return_value=mock_session):
        result = await agent._http_tool_get_solar_estimate(
            run_context, zip_code, monthly_bill, roof_type, roof_age, has_ev_plans, wants_battery
        )

    assert result == "Estimate received"
    mock_session.post.assert_called_once()
    args, kwargs = mock_session.post.call_args
    assert kwargs["json"] == expected_payload
    # Normalize URL comparison
    assert str(args[0]) == "https://kcalvin.myvnc.com/webhook/get_estimate"

@pytest.mark.asyncio
async def test_save_lead(agent, run_context):
    name = "John Doe"
    phone = "5551234567"
    email = "john@example.com"
    street = "123 Solar St"
    city = "Sunville"
    state = "CA"
    zip_code = "90000"
    roof_type = "Metal"
    monthly_bill = "200"
    interest_battery = True
    interest_ev = False
    date_time = "2026-02-10T14:00:00-05:00"

    expected_payload = {
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

    mock_response = AsyncMock()
    mock_response.status = 200
    mock_response.text.return_value = "Lead saved"

    mock_post_ctx = AsyncMock()
    mock_post_ctx.__aenter__.return_value = mock_response
    mock_post_ctx.__aexit__.return_value = None

    mock_session = MagicMock()
    mock_session.post.return_value = mock_post_ctx

    with patch("livekit.agents.utils.http_context.http_session", return_value=mock_session):
        result = await agent._http_tool_save_lead(
            run_context, name, phone, email, street, city, state, zip_code, roof_type, monthly_bill, interest_battery, interest_ev, date_time
        )
    
    assert result == "Lead saved"
    mock_session.post.assert_called_once()
    args, kwargs = mock_session.post.call_args
    assert kwargs["json"] == expected_payload
    assert str(args[0]) == "https://kcalvin.myvnc.com/webhook-test/save_lead"
