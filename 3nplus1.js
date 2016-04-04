/**
 * A little demo of my favourite math conundrum
 *
 * This uses the internals of my Tpa library to perform ultra-fast operations
 * on a large number ...
 *
 */
var Tpa=require('./lib/Tpa.js');

var n=Tpa.random(10000).number; // A big number!
var ups= 0,downs=0;
while (n.digits.length>1 && n.digits[0]>1) { // Go on until we reach 1!
    if (n.isDivisibleBy(2)) {   // If even, divide by two
        n.digitDivide(2);
        downs++;
    }
    else { // If odd multiply by 3, add 1 and then divide by 2
        n._digitMultiplyWithAdd(3,1).digitDivide(2);
        ups++;
    }
}
/*eslint no-console: "off" */
console.log('ups: '+ups+' downs: '+downs);
