import jwt from "jsonwebtoken";

export function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const token = header.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
}

export function managerOnly(req, res, next) {
  if (req.user?.role !== "manager") {
    return res.status(403).json({
      success: false,
      message: "Manager access required"
    });
  }

  next();
}
