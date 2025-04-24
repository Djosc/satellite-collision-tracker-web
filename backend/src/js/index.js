const express = require('express');
const cheerio = require('cheerio');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const PORT = process.env.PORT || 8080;
const CELESTRAK_BASE_URL = process.env.CELESTRAK_BASE_URL || 'https://celestrak.com';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
	cors({
		origin: process.env.CORS_ORIGIN || '*',
	})
);

const url = `${CELESTRAK_BASE_URL}/SOCRATES/search-results.php?IDENT=NAME&NAME_TEXT1=&NAME_TEXT2=&ORDER=MAXPROB&MAX=10`;

app.get('/collisions', async (req, res) => {
	try {
		const data = await axios({ method: 'get', url: url });
		const $ = cheerio.load(data.data);

		var testArr = [];

		$('.outline > tbody > tr > td').each((idx, el) => {
			const test = $(el).text();
			testArr.push(test);
		});
		// console.log(testArr);
		res.status(200).json(testArr);
	} catch (error) {
		console.error('Error fetching collisions:', error.message);
		res.status(500).json({ error: 'Failed to fetch collision data' });
	}
});

app.get('/tles', async (req, res) => {
	if (!req.query.id) {
		return res.status(400).json({ error: 'Missing satellite ID' });
	}

	try {
		const response = await axios(`${CELESTRAK_BASE_URL}/NORAD/elements/gp.php?CATNR=${req.query.id}&FORMAT=TLE`);
		res.status(200).json(response.data);
	} catch (error) {
		console.error('Error fetching TLE data:', error.message);
		res.status(500).json({ error: 'Failed to fetch TLE data' });
	}
});

app.listen(PORT, () => console.log(`Server running on port ${PORT} with CORS origin: ${process.env.CORS_ORIGIN || '*'}`));
