export const ipServer = "http://localhost:9061";
export const max_price = 9000;
export const isFreeTime = 0; // daqiqa

export const tariffs = [
  {
    value: "Yengil avtomobillar va mikroavtobuslar",
    price: 35000,
    pricePerDay: 12000,
    id: 1,
    state: true,
    icon: "mdi:car",
  },
  {
    value: "Yuk mashinalari, avtobuslar, traktorlari",
    price: 40000,
    pricePerDay: 12000,
    id: 2,
    state: false,
    icon: "mdi:dump-truck",
  },
  {
    value: "Mototsikllar, motorollerlar va mopedlar",
    price: 20000,
    pricePerDay: 12000,
    id: 3,
    state: false,
    icon: "mdi:motorbike",
  },
  {
    value: "Velosipedlar",
    price: 12000,
    pricePerDay: 12000,
    id: 4,
    state: false,
    icon: "mdi:bike",
  },
  {
    value: "Parkovka",
    price: 3000,
    pricePerDay: 3000,
    id: 5,
    state: false,
    icon: "mdi:parking",
  },
];
