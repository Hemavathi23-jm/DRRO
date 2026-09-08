// src/pages/Requests/mockData.js
export const REQUESTS = [
  { id:1, disaster:'Kerala Floods 2026', location:'Wayanad North',   urgency:'CRITICAL', status:'VERIFIED',            deadline:'2026-08-29T12:00:00Z', createdBy:'officer@drro.in', notes:'Immediate food and water needed' },
  { id:2, disaster:'Kerala Floods 2026', location:'Alappuzha Coast', urgency:'HIGH',     status:'ALLOCATED',           deadline:'2026-08-30T08:00:00Z', createdBy:'officer@drro.in', notes:'Medical supplies for displaced families' },
  { id:3, disaster:'Wayanad Landslide',  location:'Kodagu Valley',   urgency:'CRITICAL', status:'PARTIALLY_FULFILLED', deadline:'2026-08-28T18:00:00Z', createdBy:'officer@drro.in', notes:'Rescue equipment and personnel' },
  { id:4, disaster:'Kodagu Earthquake',  location:'Munnar Heights',  urgency:'MEDIUM',   status:'PENDING',             deadline:'2026-08-31T00:00:00Z', createdBy:'officer@drro.in', notes:'Shelter tarpaulins' },
  { id:5, disaster:'Kerala Floods 2026', location:'Palakkad East',   urgency:'LOW',      status:'FULFILLED',           deadline:'2026-09-01T00:00:00Z', createdBy:'officer@drro.in', notes:'Additional drinking water' },
];

export const REQUEST_ITEMS = {
  1: [
    { id:1, resource:'Rice (25kg bag)',  required:200, fulfilled:0,   unit:'bags' },
    { id:2, resource:'Drinking Water',  required:5000, fulfilled:0,  unit:'litres' },
  ],
  2: [
    { id:3, resource:'First Aid Kit',   required:50,  fulfilled:50,  unit:'units' },
    { id:4, resource:'Oral Rehydration',required:300, fulfilled:150, unit:'packets' },
  ],
  3: [
    { id:5, resource:'Life Jacket',     required:40,  fulfilled:20,  unit:'units' },
    { id:6, resource:'Rescue Rope',     required:200, fulfilled:100, unit:'metres' },
  ],
  4: [
    { id:7, resource:'Tarpaulin Sheet', required:100, fulfilled:0,   unit:'sheets' },
  ],
  5: [
    { id:8, resource:'Drinking Water',  required:2000, fulfilled:2000,unit:'litres' },
  ],
};
