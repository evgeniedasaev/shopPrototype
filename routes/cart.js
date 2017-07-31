var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var passport = require('passport');

var csrfProtection = csrf();
router.use(csrfProtection);

var Product = require('../models/product');
var Cart = require('../models/cart');
var Order = require('../models/order');

/* GET home page. */
router.get('/add/:id', function(req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {items: {}});

    Product.findById(productId, function(err, product) {
        if (err) {
            return res.redirect('/');
        }

        cart.add(product, 1);

        req.session.cart = cart;

        res.redirect('back');
    });
});

router.get('/checkout', isLoggedIn, function(req, res, next) {
    if (!req.session.cart) {
        return res.render('cart/index', {products: null});
    }

    var cart = new Cart(req.session.cart);
    res.render('cart/index', {csrfToken: req.csrfToken(), products: cart.getItemList(), cart: cart, formData: req.body});
});

router.post('/checkout', isLoggedIn, function(req, res, next) {
    var cart = new Cart(req.session.cart);

    var responseInfo = {
        csrfToken: req.csrfToken(), 
        products: cart.getItemList(), 
        cart: cart,
        formData: req.body,
        noError: true
    };

    var cardInfo = req.body.card;
    var stripe = require('stripe')('sk_test_pfU2m8IXFza6iEByXMmD0sJU');

    function handleStripeError(err) {
        responseInfo.noError = false;

        switch (err.type) {
            case 'StripeCardError':
                // A declined card error
                responseInfo.errMsg = err.message;
                break;
            case 'RateLimitError':
                responseInfo.errMsg = "Too many requests made to the API too quickly";
                break;
            case 'StripeInvalidRequestError':
                responseInfo.errMsg = "Invalid parameters were supplied to Stripe's API";
                break;
            case 'StripeAPIError':
                responseInfo.errMsg = "An error occurred internally with Stripe's API";
                break;
            case 'StripeConnectionError':
                responseInfo.errMsg = "Some kind of error occurred during the HTTPS communication";
                break;
            case 'StripeAuthenticationError':
                responseInfo.errMsg = "You probably used an incorrect API key";
                break;
            default:
                responseInfo.errMsg = "Handle any other types of unexpected errors";
                break;
        }
        console.log(err);
        res.render('cart/index', responseInfo);
    }

    stripe.tokens.create({
        card: {
            "number": cardInfo.number,
            "exp_month": cardInfo.expire.month,
            "exp_year": cardInfo.expire.year,
            "cvc": cardInfo.cvc
        }
    }).then(function(response) {
        responseInfo.tokean = response.id; 
        
        stripe.charges.create({
            amount: cart.totalPrice * 100,
            currency: "usd",
            source: response.id,
            description: "Test Charge"
        }).then(function(charge) {
            var order = new Order({
                user: req.user,
                cart: cart,
                address: req.body.address,
                name: req.body.name,
                paymentId: charge.id
            });
            order.save(function(err, result) {
                req.flash('success', 'Ваш заказ успешно оформлен!');
                req.session.cart = {};
                res.redirect('/');
            });
        }).catch(handleStripeError);
    }).catch(handleStripeError);
});

module.exports = router;

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.session.oldUrl = req.url;
    res.redirect('/user/signin/');
}
