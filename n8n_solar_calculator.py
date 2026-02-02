
# ==========================================
# MOCK N8N ENVIRONMENT (FOR LOCAL TESTING)
# ==========================================
# This block simulates the 'items' variable that n8n provides automatically.
# When copying to n8n, DO NOT COPY the 'if __name__ == "__main__":' block 
# or this MockItem class setup if you want to use real n8n data.
# However, n8n Python nodes usually operate on a global 'items' list.

try:
    items
except NameError:
    # We are running locally, so we create a mock item structure
    class MockItem:
        def __init__(self, data):
            self.json = data
    
    # Simulate input from previous nodes (e.g., from a Webhook or HTTP Request)
    items = [
        MockItem({
            "monthly_bill": 160.00,
            "electricity_rate": 0.14,
            # Mock Google Solar API Partial Response
            "google_solar_response": {
                "solarPotential": {
                    "panelCapacityWatts": 400,
                    "solarPanelConfigs": [
                        {"panelsCount": 10, "yearlyEnergyDcKwh": 5800},
                        {"panelsCount": 20, "yearlyEnergyDcKwh": 11600},
                        {"panelsCount": 28, "yearlyEnergyDcKwh": 16240},
                        {"panelsCount": 35, "yearlyEnergyDcKwh": 20300},
                    ]
                }
            }
        })
    ]

# ==========================================
# START N8N CODE
# ==========================================
# Copy everything below this line into your n8n Python Code Node

def calculate_solar_needs(item):
    """
    Process a single item to calculate solar recommendations.
    """
    # 1. Extract Inputs (Handle missing keys gracefully)
    data = item.json
    monthly_bill = data.get('monthly_bill', 0)
    rate_per_kwh = data.get('electricity_rate', 0.14) # Default to 0.14 if missing
    api_response = data.get('google_solar_response', {})

    # 2. Estimate Annual Usage
    if rate_per_kwh <= 0:
        return {"error": "Invalid electricity rate"}
        
    annual_kwh_usage = (monthly_bill / rate_per_kwh) * 12

    # 3. Solar Calculation Logic
    solar_potential = api_response.get('solarPotential', {})
    configs = solar_potential.get('solarPanelConfigs', [])
    panel_watts = solar_potential.get('panelCapacityWatts', 400)
    
    # Derate factor (DC to AC)
    PERFORMANCE_RATIO = 0.85 

    recommended_config = None
    
    # Sort by size to find smallest efficient match
    # In n8n python, we might not have full stdlib access depending on setup, 
    # but 'sorted' and 'lambda' are standard built-ins.
    sorted_configs = sorted(configs, key=lambda x: x.get('panelsCount', 0))

    best_match = None
    
    for config in sorted_configs:
        dc_kwh = config.get('yearlyEnergyDcKwh', 0)
        ac_kwh = dc_kwh * PERFORMANCE_RATIO
        
        if ac_kwh >= annual_kwh_usage:
            best_match = config
            break
    
    # Fallback to largest if none meet 100%
    if not best_match and sorted_configs:
        best_match = sorted_configs[-1]

    # 4. Format Result
    result = {
        "input_bill": monthly_bill,
        "appx_annual_usage_kwh": round(annual_kwh_usage, 0),
        "found_solution": bool(best_match),
        "recommendation": {}
    }

    if best_match:
        panels = best_match.get('panelsCount', 0)
        dc_prod = best_match.get('yearlyEnergyDcKwh', 0)
        ac_prod = dc_prod * PERFORMANCE_RATIO
        system_kw = (panels * panel_watts) / 1000
        offset = (ac_prod / annual_kwh_usage) * 100 if annual_kwh_usage > 0 else 0

        result["recommendation"] = {
            "system_size_kw": system_kw,
            "panel_count": panels,
            "panel_wattage": panel_watts,
            "est_annual_production_ac_kwh": round(ac_prod, 0),
            "offset_percentage": round(offset, 1)
        }
    
    return result

# Iterate over all items (n8n standard pattern)
for item in items:
    # Run calculation and attach result to the item
    # We write to a new key 'solar_calculation' to avoid overwriting inputs
    item.json['solar_calculation'] = calculate_solar_needs(item)

# Output data returned here will be passed to the next node
# In n8n, the final expression is implicitly returned if it's the last line,
# or we just rely on mutating 'items' in place.
# For local testing, we print the result.
# ==========================================
# END N8N CODE
# ==========================================

if __name__ == "__main__":
    import json
    # Simple print to verify local execution
    print(json.dumps([i.json for i in items], indent=2))
