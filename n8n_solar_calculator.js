// ==========================================
// MOCK N8N ENVIRONMENT (FOR LOCAL TESTING - NODE.JS)
// ==========================================
let items;

if (typeof items === "undefined") {
  items = [
    {
      json: {
        zip_code: "33033",
        monthly_bill: 160.0,
        roof_type: "shingle",
        roof_age: 10,
        has_ev_plans: true,
        wants_battery: false,
        google_solar_response: {
          solarPotential: {
            panelCapacityWatts: 400,
            solarPanelConfigs: [
              { panelsCount: 10, yearlyEnergyDcKwh: 5800 },
              { panelsCount: 20, yearlyEnergyDcKwh: 11600 },
              { panelsCount: 23, yearlyEnergyDcKwh: 13905 },
              { panelsCount: 28, yearlyEnergyDcKwh: 16240 },
            ],
          },
        },
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
  const ratePerKwh = 0.14;
  const zipCode = data.zip_code || "Unknown";

  // 2. Estimate Annual Usage
  const annualKwhUsage = (monthlyBill / ratePerKwh) * 12;

  // 3. Solar Calculation Logic - SMART DETECTION
  let configs = [];
  let panelWatts = 400;

  if (data.google_solar_response?.solarPotential?.solarPanelConfigs) {
    configs = data.google_solar_response.solarPotential.solarPanelConfigs;
    panelWatts =
      data.google_solar_response.solarPotential.panelCapacityWatts || 400;
  } else if (data.solarPotential?.solarPanelConfigs) {
    configs = data.solarPotential.solarPanelConfigs;
    panelWatts = data.solarPotential.panelCapacityWatts || 400;
  } else if (data.solarPanelConfigs) {
    configs = data.solarPanelConfigs;
    panelWatts = data.panelCapacityWatts || 400;
  }

  const PERFORMANCE_RATIO = 0.85;

  // Sort by size
  const sortedConfigs = [...configs].sort(
    (a, b) => (a.panelsCount || 0) - (b.panelsCount || 0),
  );

  let bestMatch = null;
  for (const config of sortedConfigs) {
    const acKwh = (config.yearlyEnergyDcKwh || 0) * PERFORMANCE_RATIO;
    if (acKwh >= annualKwhUsage) {
      bestMatch = config;
      break;
    }
  }
  // Fallback to largest if none meet 100%
  if (!bestMatch && sortedConfigs.length > 0) {
    bestMatch = sortedConfigs[sortedConfigs.length - 1];
  }

  // 4. Return Structured Data Only
  if (bestMatch) {
    const panels = bestMatch.panelsCount || 0;
    const systemKw = (panels * panelWatts) / 1000;
    const acProd = (bestMatch.yearlyEnergyDcKwh || 0) * PERFORMANCE_RATIO;
    const offset = annualKwhUsage > 0 ? (acProd / annualKwhUsage) * 100 : 0;

    return {
      possible: true,
      zip_code: zipCode,
      system_size_kw: Number(systemKw.toFixed(2)),
      panel_count: panels,
      panel_wattage: panelWatts,
      estimated_annual_production_kwh: Math.round(acProd),
      estimated_bill_offset_percentage: Number(offset.toFixed(1)),
      annual_usage_kwh_estimate: Math.round(annualKwhUsage),
    };
  }

  return {
    possible: false,
    error: "Insufficient solar data or no valid configuration found.",
  };
}

// Execution Loop
for (const item of items) {
  try {
    // Output result to 'solar_result' field (clean separation)
    item.json.solar_result = calculateSolarNeeds(item);
  } catch (error) {
    item.json.solar_result = { possible: false, error: error.message };
  }
}

return items;
// ==========================================
// END N8N CODE
// ==========================================

console.log(JSON.stringify(items, null, 2));
