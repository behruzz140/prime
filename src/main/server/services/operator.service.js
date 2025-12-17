import db from "@/db/database.js";

const getOperators = async (req, res) => {
  try {
    const data = db.prepare("SELECT * FROM operators ORDER BY id ASC").all();

    res.status(200).send(data);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

const postOperators = async (req, res) => {
  try {
    const stmt = db.prepare(`
   INSERT INTO operators DEFAULT VALUES
  `);

    const result = stmt.run();

    const insertedData = db
      .prepare("SELECT * FROM operators WHERE id = ?")
      .get(result.lastInsertRowid);

    const data = db
      .prepare(
        `UPDATE operators
         SET name = ?
         WHERE id = ?;`
      )
      .run(`OPERATOR-${insertedData.id}`, insertedData.id);

    const updatedInfo = db.prepare("SELECT * FROM operators WHERE id = ?").get(insertedData.id);

    res.status(200).send(updatedInfo);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

const putOperators = async (req, res) => {
  try {
    const { name } = req.body;
    const { id } = req.params;

    const data = db
      .prepare(
        `UPDATE operators
         SET name = ?
         WHERE id = ?;`
      )
      .run(name, id);

    const updatedData = db.prepare("SELECT * FROM operators WHERE id = ?").get(id);

    res.status(200).send(updatedData);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

const deleteOperators = async (req, res) => {
  try {
    const { id } = req.params;

    const data = db
      .prepare(
        `DELETE FROM operators
WHERE id = ?;`
      )
      .run(id);

    db.prepare(`DELETE FROM cameras WHERE operatorId = ?`).run(id);

    res.status(200).send({
      message: "Deleted successfully",
    });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

const getMac = async (req, res) => {
  try {
    const data = db.prepare("SELECT * from config ORDER BY id ASC").get();

    res.status(200).send(data);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

const putMac = async (req, res) => {
  try {
    const { mac } = req.body;

    const item = db.prepare("SELECT * from config ORDER BY id ASC").get();

    if (!item) {
      const insertStmt = db.prepare(`
        INSERT INTO config (mac) VALUES (?);
      `);
      const insertResult = insertStmt.run(mac);
      const newItem = db
        .prepare("SELECT * from config WHERE id = ?")
        .get(insertResult.lastInsertRowid);

      const data = db
        .prepare(
          `UPDATE config
         SET mac = ?
         WHERE id = ?;`
        )
        .run(mac, newItem.id);

      const updatedData = db.prepare("SELECT * from config WHERE id = ?").get(newItem.id);

      res.status(200).send(updatedData);
    } else {
      const data = db
        .prepare(
          `UPDATE config
         SET mac = ?
         WHERE id = ?;`
        )
        .run(mac, item.id);

      const updatedData = db.prepare("SELECT * from config WHERE id = ?").get(item.id);

      res.status(200).send(updatedData);
    }
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

const putPrinter = async (req, res) => {
  try {
    const { is_printer } = req.body;

    const printInfo = is_printer == true ? 1 : 0;

    const item = db.prepare("SELECT * from config ORDER BY id ASC").get();

    if (!item) {
      const insertStmt = db.prepare(`
        INSERT INTO config (is_printer) VALUES (?);
      `);
      const insertResult = insertStmt.run(printInfo);
      const newItem = db
        .prepare("SELECT * from config WHERE id = ?")
        .get(insertResult.lastInsertRowid);

      const data = db
        .prepare(
          `UPDATE config
         SET is_printer = ?
         WHERE id = ?;`
        )
        .run(printInfo, newItem.id);

      const updatedData = db.prepare("SELECT * from config WHERE id = ?").get(newItem.id);

      res.status(200).send(updatedData);
    } else {
      const data = db
        .prepare(
          `UPDATE config
         SET is_printer = ?
         WHERE id = ?;`
        )
        .run(printInfo, item.id);

      const updatedData = db.prepare("SELECT * from config WHERE id = ?").get(item.id);

      res.status(200).send(updatedData);
    }
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

const putMarket = async (req, res) => {
  try {
    const { is_market } = req.body;

    const marketInfo = is_market == true ? 1 : 0;

    const item = db.prepare("SELECT * from config ORDER BY id ASC").get();

    if (!item) {
      const insertStmt = db.prepare(`
        INSERT INTO config (is_market) VALUES (?);
      `);
      const insertResult = insertStmt.run(marketInfo);
      const newItem = db
        .prepare("SELECT * from config WHERE id = ?")
        .get(insertResult.lastInsertRowid);

      const data = db
        .prepare(
          `UPDATE config
         SET is_market = ?
         WHERE id = ?;`
        )
        .run(marketInfo, newItem.id);

      const updatedData = db.prepare("SELECT * from config WHERE id = ?").get(newItem.id);

      res.status(200).send(updatedData);
    } else {
      const data = db
        .prepare(
          `UPDATE config
         SET is_market = ?
         WHERE id = ?;`
        )
        .run(marketInfo, item.id);

      const updatedData = db.prepare("SELECT * from config WHERE id = ?").get(item.id);

      res.status(200).send(updatedData);
    }
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

export {
  getOperators,
  postOperators,
  putOperators,
  deleteOperators,
  getMac,
  putMac,
  putPrinter,
  putMarket,
};
