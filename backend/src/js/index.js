const express = require('express');
const cheerio = require('cheerio');
const axios = require('axios');
const cors = require('cors');

const PORT = process.env.PORT || 8080;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
	cors({
		origin: '*',
	})
);

const url =
	'https://celestrak.com/SOCRATES/search-results.php?IDENT=NAME&NAME_TEXT1=&NAME_TEXT2=&ORDER=MAXPROB&MAX=10';

app.get('/collisions', async (req, res) => {
	try {
		const data = await axios({ method: 'get', url: url });
		const $ = cheerio.load(data.data);

		var testArr = [];

		$('.outline > tbody > tr > td').each((idx, el) => {
			const test = $(el).text();
			testArr.push(test);
		});
		console.log(testArr);
		res.status(200).json(testArr);
	} catch {
		res.status(500);
	}
});

app.listen(PORT, () => console.log('Listening on port: ' + PORT));
