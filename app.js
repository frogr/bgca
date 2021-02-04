var express = require('express'),
	app = express(),
	fs = require('fs'),
	publicdir = __dirname + '/src',
	bodyParser = require('body-parser'),
	methodOverride = require('method-override'),
	stripe = require("stripe")("sk_test_4VdenAShdLicusZxNZE5xern")

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride());
app.set('port', 5000);
app.use(express.static('public'));

// DEV SETTINGS
let server = app.listen(app.get('port'), function() {
	let port = server.address().port;
	console.log('DEV SITE: Magic happens on port ' + port);
});

app.post("/create-payment-intent", async (req, res) => {
	console.log(req.body)
	const amount = Number(req.body.items[0].amount) * 100; // change from cents to dollars
	const siteName = req.body.items[0].siteName;
	const statement_descriptor = req.body.items[0].statement_descriptor;
	const { firstName, lastName, email } = req.body.items[0].metadata
  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
		amount: amount,
		description: siteName,
		statement_descriptor: statement_descriptor,
		currency: "usd",
		metadata: {
			firstName: firstName,
			lastName: lastName,
			email: email
		}
  });
  res.send({
    clientSecret: paymentIntent.client_secret
  });
});

app.post('/adhoc/stripe/charge', function(req, res) {
    // Token is created using Checkout or Elements!
    var token = req.body.stripeToken;

    // Charge the user's card:
    stripe.charges.create({
        amount: req.body.price * 100, // to convert to whole number (without decimals)
        currency: 'usd',
        description: 'Donation to ' + req.body.site_name,
        statement_descriptor: req.body.site_name,
        metadata: {
            'company': req.body.company,
            'nameOfPerson': req.body.fullName,
            'email': req.body.email,
            'purchaseDescription': req.body.purchaseDescription
        },
        source: token.id,
    }).then(
			function(charge) {
					if (charge && charge.paid) {
							return res.status(200).json({message : 'Successfully processed'});
					} else {
							return res.status(400).send({message : 'Failed to create charge'});
					}
			},
			function (err) {
					console.log('STRIPE Adhoc Charge ERROR:::::', err);
					if (err.type === 'StripeCardError') {
							return res.status(400).json({message: err});
					}
			}
	);
});

