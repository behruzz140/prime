import db from "../db/database.js";
import { max_price,isFreeTime }  from "../config/index.js";

const calculateParkingCostHour = (entryTime, hourlyCost) => {
    try {
        const entryDate = new Date(entryTime).getTime();
        const currentDate = new Date().getTime();
        const diffInMinutes = (currentDate - entryDate) / (1000 * 60);
        const extraHours = Math.ceil(diffInMinutes / 60);
        const price = extraHours * hourlyCost;

        if(diffInMinutes <= isFreeTime) {
          return null;
        }

        if(price > max_price){
          return max_price;
        }else {
          return price;
        }
    } catch (error) {
        console.error("Ошибка при расчете стоимости парковки:", error);
        return 0;
    }
};


const isPeriodPaidHours = (entryTime, paidHours) => {
    try {
        const entryDate = new Date(entryTime).getTime();
        const currentDate = new Date().getTime();
        const diffInMinutes = (currentDate - entryDate) / (1000 * 60);

        return paidHours > Math.floor(diffInMinutes / 60);
    } catch (error) {
        console.error("Ошибка при проверке оплаченного периода:", error);
        return false;
    }
};

const isPayedHours = (item, type = "number") => {
    const session = db
        .prepare(
            `SELECT * FROM sessions
       WHERE ${type == "number" ? "plateNumber" : "id"} = ?
       AND endTime IS NOT NULL
       ORDER BY startTime DESC
       LIMIT 1`
        )
        .get(item);

    if (!session) return false;

    const currentTarif = tariffs.find((tarif) => tarif.id === session.tariffType).pricePerDay;

    const payedHours = session.outputCost / currentTarif || 0;

    return isPeriodPaidHours(session.startTime, payedHours);
};






export { calculateParkingCostHour, isPeriodPaidHours, isPayedHours };
