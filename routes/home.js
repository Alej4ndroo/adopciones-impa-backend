const express = require('express');
const router = express.Router();
const { renderHome } = require('../controllers/homeController');

router.get('/', renderHome); // GET /home

module.exports = router;
