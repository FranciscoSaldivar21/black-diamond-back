import { response } from "express"; 
import { validationResult } from "express-validator";

export const validateFields = (req, res = response, next) => {
      const error = validationResult(req);
      if (!error.isEmpty()) {
        return res.status(404).json({
          error: error.mapped(),
        });
      }
    next();
}
