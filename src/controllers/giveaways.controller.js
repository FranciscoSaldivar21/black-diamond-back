import { pool } from "../database/db.js";

export const getGiveaways = async (req, res) => {
    try {
        const [result] = await pool.query("SELECT * FROM giveaway WHERE status = ?", [req.params.status]);
        return res.send(result);
    } catch (error) {
        return res.status(500).json({
            error: "Unexpected error",
        });
    }
};

export const getGiveawayById = async (req, res) => {
    try {
      const [result] = await pool.query("SELECT * FROM giveaway WHERE id = ?", [req.params.id]);
      const [giveaway] = result;
      return res.send(giveaway);
    } catch (error) {
      return res.status(500).json({
        error: "Unexpected error",
      });
    }
};
