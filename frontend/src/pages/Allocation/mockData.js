// src/pages/Allocation/mockData.js
export const ALLOCATIONS = [
  { id:1, requestId:1, location:'Wayanad North',   resource:'Rice (25kg bag)',  center:'Calicut Relief Hub',  allocatedQty:200, priorityScore:87.4, status:'RECOMMENDED', distanceKm:42.3, travelHrs:1.8,
    factors:{ severityScore:85, populationScore:80, urgencyScore:95, shortageScore:90, travelTimeScore:65, vulnerabilityScore:75, finalScore:87.4, explanationText:'High priority — severity 85/100, remaining supply is 0% of requirement, 12,000 affected population. Calicut Relief Hub is the closest centre with sufficient stock (42.3 km, ~1.8 hrs).' }},
  { id:2, requestId:2, location:'Alappuzha Coast', resource:'Oral Rehydration', center:'Kochi Central Depot', allocatedQty:150, priorityScore:76.1, status:'APPROVED',     distanceKm:68.5, travelHrs:2.4,
    factors:{ severityScore:70, populationScore:75, urgencyScore:80, shortageScore:60, travelTimeScore:55, vulnerabilityScore:60, finalScore:76.1, explanationText:'Moderate-high priority. 50% of medical supplies already fulfilled. Kochi depot is nearest feasible centre.' }},
  { id:3, requestId:3, location:'Kodagu Valley',   resource:'Life Jacket',      center:'Wayanad Mobile Unit', allocatedQty:20,  priorityScore:92.3, status:'RECOMMENDED', distanceKm:18.7, travelHrs:0.9,
    factors:{ severityScore:92, populationScore:65, urgencyScore:98, shortageScore:95, travelTimeScore:85, vulnerabilityScore:85, finalScore:92.3, explanationText:'Critical priority — landslide with road blockage. Urgency 98/100. Wayanad Mobile Unit is only 18.7 km away.' }},
  { id:4, requestId:4, location:'Munnar Heights',  resource:'Tarpaulin Sheet',  center:'Thrissur Relief Store',allocatedQty:100, priorityScore:65.8, status:'REJECTED',    distanceKm:92.1, travelHrs:3.5,
    factors:{ severityScore:60, populationScore:40, urgencyScore:55, shortageScore:80, travelTimeScore:35, vulnerabilityScore:55, finalScore:65.8, explanationText:'Medium priority. Road access blocked — allocation rejected pending alternate route.' }},
  { id:5, requestId:5, location:'Palakkad East',   resource:'Drinking Water',   center:'Calicut Relief Hub',  allocatedQty:2000,priorityScore:71.2, status:'DELIVERED',   distanceKm:55.0, travelHrs:2.0,
    factors:{ severityScore:72, populationScore:65, urgencyScore:60, shortageScore:70, travelTimeScore:60, vulnerabilityScore:50, finalScore:71.2, explanationText:'Successfully delivered. Request fully fulfilled.' }},
];
