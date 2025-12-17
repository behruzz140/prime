import axios from "axios";

const generateOfd = async (mac_address, sum, number) => {
  try {
    const data = await axios.post(
      `https://raqamli-bozor.uz/services/platon-core/api/v2/pms/ofd`,
      {
        sum: sum,
        mac_address: mac_address,
        car_number: number,
      },
      {
        headers: {
          Authorization: "Basic " + btoa(`pms_306576853:a3f1c8d92b7e4f65`),
        },
      }
    );

    console.log(data.data, "OFD INFO");

    return data.data;
  } catch (error) {
    console.log(error, "CHECK ERROR");

    return null;
  }
};

export default generateOfd;
