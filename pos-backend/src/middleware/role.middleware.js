// Simple position-based role guard. Use like: requirePosition([1,2]) or requirePosition(3)
module.exports = function requirePosition(allowed) {
  if (!Array.isArray(allowed)) allowed = [allowed];

  return (req, res, next) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ success: false, message: 'Not authenticated' });

      // position_id may be on req.user (set by auth middleware token payload)
      const pos = user.position_id || user.positionId || user.position;
      if (pos == null) return res.status(403).json({ success: false, message: 'Access denied' });

      if (allowed.includes(pos)) return next();

      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    } catch (err) {
      console.error('Role middleware error', err);
      return res.status(500).json({ success: false, message: 'Role check failed' });
    }
  };
};