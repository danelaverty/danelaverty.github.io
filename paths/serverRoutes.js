const express = require('express');
const router = express.Router();

// Import route modules
const dataRoutes = require('./serverRoutesData');
const computedFeesRoutes = require('./serverRoutesComputedFees');
const computedFeeGroupsRoutes = require('./serverRoutesComputedFeeGroups');
const policyGroupsRoutes = require('./serverRoutesPolicyGroups');
const policiesRoutes = require('./serverRoutesPolicies');
const userNamesRoutes = require('./serverRoutesUserNames');
const scenariosRoutes = require('./serverRoutesScenarios');
const savedHistogramsRoutes = require('./serverRoutesSavedHistograms');
const histogramGridsRoutes = require('./serverRoutesHistogramGrids');

// Mount route modules
router.use('/data', dataRoutes);
router.use('/computed-fees', computedFeesRoutes);
router.use('/computed-fee-groups', computedFeeGroupsRoutes);
router.use('/policy-groups', policyGroupsRoutes);
router.use('/policies', policiesRoutes); // NEW
router.use('/user-defined-names', userNamesRoutes);
router.use('/scenarios', scenariosRoutes);
router.use('/saved-histograms', savedHistogramsRoutes);
router.use('/histogram-grids', histogramGridsRoutes);

// Legacy route redirects for backward compatibility (if needed)
router.get('/filters/values', (req, res) => {
    res.redirect('/api/data/filters/values');
});

module.exports = router;
