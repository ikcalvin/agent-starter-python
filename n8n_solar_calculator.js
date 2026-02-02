// ==========================================
// MOCK N8N ENVIRONMENT (FOR LOCAL TESTING - NODE.JS)
// ==========================================
let items;

if (typeof items === "undefined") {
  items = [
    {
      json: {
        monthly_bill: 160.0,
        electricity_rate: 0.14,
        // Scenario 1: Nested (Standard)
        google_solar_response: {
          solarPotential: {
            panelCapacityWatts: 400,
            solarPanelConfigs: [{ panelsCount: 10, yearlyEnergyDcKwh: 5800 }],
          },
        },
      },
    },
    {
      json: {
        monthly_bill: 200.0,
        electricity_rate: 0.14,
        // Scenario 2: Flattened (User mapped solarPotential directly)
        solarPanelConfigs: [{ panelsCount: 20, yearlyEnergyDcKwh: 11600 }],
        panelCapacityWatts: 400,
      },
    },
  ];
}

// ==========================================
// START N8N CODE
// ==========================================

function calculateSolarNeeds(item) {
  const data = item.json;

  // 1. Extract Inputs
  const monthlyBill = data.monthly_bill || 160;
  const ratePerKwh = data.electricity_rate || 0.14;

  // 2. Estimate Annual Usage
  if (ratePerKwh <= 0) {
    return { error: "Invalid electricity rate" };
  }
  const annualKwhUsage = (monthlyBill / ratePerKwh) * 12;

  // 3. Solar Calculation Logic - SMART DETECTION
  let configs = [];
  let panelWatts = 400;

  // Path A: Standard nested structure (google_solar_response.solarPotential...)
  if (data.google_solar_response?.solarPotential?.solarPanelConfigs) {
    configs = data.google_solar_response.solarPotential.solarPanelConfigs;
    panelWatts =
      data.google_solar_response.solarPotential.panelCapacityWatts || 400;
  }
  // Path B: Intermediate nesting (solarPotential...)
  else if (data.solarPotential?.solarPanelConfigs) {
    configs = data.solarPotential.solarPanelConfigs;
    panelWatts = data.solarPotential.panelCapacityWatts || 400;
  }
  // Path C: Flat structure (Directly in root)
  else if (data.solarPanelConfigs) {
    configs = data.solarPanelConfigs;
    panelWatts = data.panelCapacityWatts || 400;
  }

  // Derate factor (DC to AC)
  const PERFORMANCE_RATIO = 0.85;

  // Sort by size to find smallest efficient match
  const sortedConfigs = [...configs].sort(
    (a, b) => (a.panelsCount || 0) - (b.panelsCount || 0),
  );

  let bestMatch = null;

  for (const config of sortedConfigs) {
    const dcKwh = config.yearlyEnergyDcKwh || 0;
    const acKwh = dcKwh * PERFORMANCE_RATIO;

    if (acKwh >= annualKwhUsage) {
      bestMatch = config;
      break;
    }
  }

  // Fallback to largest if none meet 100%
  if (!bestMatch && sortedConfigs.length > 0) {
    bestMatch = sortedConfigs[sortedConfigs.length - 1];
  }

  // 4. Format Result
  const result = {
    input_bill: monthlyBill,
    appx_annual_usage_kwh: Math.round(annualKwhUsage),
    found_solution: !!bestMatch,
    recommendation: {},
  };

  if (bestMatch) {
    const panels = bestMatch.panelsCount || 0;
    const dcProd = bestMatch.yearlyEnergyDcKwh || 0;
    const acProd = dcProd * PERFORMANCE_RATIO;
    const systemKw = (panels * panelWatts) / 1000;
    const offset = annualKwhUsage > 0 ? (acProd / annualKwhUsage) * 100 : 0;

    result.recommendation = {
      system_size_kw: Number(systemKw.toFixed(2)),
      panel_count: panels,
      panel_wattage: panelWatts,
      est_annual_production_ac_kwh: Math.round(acProd),
      offset_percentage: Number(offset.toFixed(1)),
    };
  }

  return result;
}

// Execution Loop
for (const item of items) {
  try {
    item.json.solar_calculation = calculateSolarNeeds(item);
  } catch (error) {
    item.json.solar_calculation_error = error.message;
  }
}

return items;
// ^ IMPORTANT: This return statement is required in "Run Once for All Items" mode.

// ==========================================
// END N8N CODE
// ==========================================

console.log(JSON.stringify(items, null, 2));
