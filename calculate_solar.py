
import json

def get_annual_kwh(monthly_bill, rate_per_kwh):
    """
    Calculates estimated annual kWh usage from monthly bill.
    """
    if rate_per_kwh <= 0:
        raise ValueError("Rate per kWh must be greater than 0")
    
    monthly_kwh = monthly_bill / rate_per_kwh
    annual_kwh = monthly_kwh * 12
    return annual_kwh

def find_optimal_config(api_response, target_annual_kwh):
    """
    Finds the optimal solar configuration from Google Solar API response
    that meets the target annual AC energy production.
    """
    solar_potential = api_response.get('solarPotential', {})
    configs = solar_potential.get('solarPanelConfigs', [])
    panel_watts = solar_potential.get('panelCapacityWatts', 400) # Default 400W if missing

    # Standard Derate Factor (DC to AC conversion)
    # Accounts for inverter efficiency, wiring, soiling, shading not captured by API, etc.
    # PVWatts default is often around 0.86. We use 0.85 as a conservative estimate.
    PERFORMANCE_RATIO = 0.85

    recommended_config = None
    
    # Sort configs by panels count just to be sure we search incrementally
    configs.sort(key=lambda x: x.get('panelsCount', 0))

    print(f"{'Panels':<10} | {'System Size (kW)':<18} | {'Est. AC Production (kWh)':<25} | {'Coverage'}")
    print("-" * 75)

    for config in configs:
        dc_kwh = config.get('yearlyEnergyDcKwh', 0)
        ac_kwh = dc_kwh * PERFORMANCE_RATIO
        
        panels = config.get('panelsCount', 0)
        system_kw = (panels * panel_watts) / 1000
        coverage = (ac_kwh / target_annual_kwh) * 100
        
        print(f"{panels:<10} | {system_kw:<18.2f} | {ac_kwh:<25.0f} | {coverage:.1f}%")

        if ac_kwh >= target_annual_kwh:
            recommended_config = config
            break
            
    # If no config meets the target, return the largest one
    if not recommended_config and configs:
        print("\n[WARN] No configuration fully meets 100% usage. Selecting largest available.")
        recommended_config = configs[-1]

    return recommended_config, panel_watts, PERFORMANCE_RATIO

def main():
    # --- Input Data ---
    MONTHLY_BILL = 160.00
    # Average rate for Homestead, FL (Zip 33033) ~ $0.14/kWh
    ELEC_RATE = 0.14 
    
    print(f"--- Solar System Calculator for Zip 33033 ---")
    print(f"Monthly Bill: ${MONTHLY_BILL}")
    print(f"Est. Rate: ${ELEC_RATE}/kWh")
    
    try:
        annual_usage = get_annual_kwh(MONTHLY_BILL, ELEC_RATE)
        print(f"Estimated Annual Usage: {annual_usage:,.0f} kWh\n")
    except ValueError as e:
        print(e)
        return

    # --- Mock Google Solar API Response ---
    # This simulates what you would get from the buildingInsights endpoint
    # The 'yearlyEnergyDcKwh' values are examples of realistic production in FL
    mock_api_response = {
        "solarPotential": {
            "panelCapacityWatts": 400,
            "solarPanelConfigs": [
                {"panelsCount": 10, "yearlyEnergyDcKwh": 5800},
                {"panelsCount": 15, "yearlyEnergyDcKwh": 8700},
                {"panelsCount": 20, "yearlyEnergyDcKwh": 11600},
                {"panelsCount": 25, "yearlyEnergyDcKwh": 14500},
                {"panelsCount": 28, "yearlyEnergyDcKwh": 16240},
                {"panelsCount": 30, "yearlyEnergyDcKwh": 17400},
                {"panelsCount": 35, "yearlyEnergyDcKwh": 20300},
            ]
        }
    }

    # --- Calculation ---
    recommended_config, panel_watts, pr = find_optimal_config(mock_api_response, annual_usage)

    if recommended_config:
        panels = recommended_config['panelsCount']
        dc_production = recommended_config['yearlyEnergyDcKwh']
        ac_production = dc_production * pr
        system_size_kw = (panels * panel_watts) / 1000
        offset = (ac_production / annual_usage) * 100

        print("\n--- Recommendation ---")
        print(f"System Size: {system_size_kw} kW")
        print(f"Panel Count: {panels} ({panel_watts}W each)")
        print(f"Est. Annual AC Production: {ac_production:,.0f} kWh")
        print(f"Offset: {offset:.1f}% of annual usage")
    else:
        print("Could not determine a recommended configuration.")

if __name__ == "__main__":
    main()
