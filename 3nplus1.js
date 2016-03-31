var Tpa=require('./lib/Tpa.js');

var n=Tpa.random(10000).number;
var ups= 0,downs=0;
while (n.digits.length>1 && n.digits[0]>1) {
    if (n.isDivisibleBy(2)) {
        n.digitDivide(2);
        downs++;
    }
    else {
        n._digitMultiplyWithAdd(3,1).digitDivide(2);
        ups++;
    }
}
console.log("ups: "+ups+" downs: "+downs);
