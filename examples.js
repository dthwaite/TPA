/*
Examples as given in README.md
 */
var Tpa=require('./lib/tpa');

// Inputting
var n1=new Tpa();                // new integer set to zero
var n2=new Tpa(123);             // new integer set to 123
var n3=new Tpa(213.5);           // new fraction set to 123.5
var n4=new Tpa('123');           // new integer set to 123
var n5=new Tpa('123.3[3]');      // new fraction set to 123 1/3
var n6=new Tpa('123 1/3');       // new fraction set to 123 1/3
var n7=new Tpa('-4 538/1284');   // new fraction set to to -4.41900311...
var n8=new Tpa('-.2[512]');      // new fraction
n8.set(-9);                      // Sets an existing number to a new value
n8.set();                        // resets an existing number to zero
n8.set('-4 538/1284');           // resets an existing number 4.41900311...
n8.set(n2);                      // Sets an existing number to equal another (takes a copy)

//Outputting
console.log(n1.toString());      // '0'
console.log(n2.toString());      // '123'
console.log(n2.value());         // 123.0
console.log(n3.toString());      // '123.5'
console.log(n3.toDecimal());     // '123.5' (alias for toString())
console.log(n3.toFraction());    // '123 5/10'
n3.simplify();
console.log(n3.toFraction());    // '123 1/2'
console.log(n5.toDecimal());     // '123.[3]
console.log(n5.toFraction());    // '123 30/90'
console.log(n7.toFraction());    // '-4 538/1284'
n7.simplify();
console.log(n7.toFraction());    // '-4 269/642'
console.log(n7.toDecimal());     // '-4.4[19003115264797507788161993769470404984423676012461059]'
console.log(n7.toDecimal(20));   // '-4.41900311526479750778...' (limit dp's to 20)

//Operations
console.log(n2.add(n2).toString());         // '246'
console.log(n2.subtract(123).toString());   // '123'
n2.subtract('200');
console.log(n2.toDecimal());                // '-77'
n2.add(new Tpa(200));
console.log(n2.toDecimal());                // '123'
console.log(n5.multiply(n3).toString());    // '26331.[6]' (123 3/9 * 123.5)
n5.divide(n3);
console.log(n5.toString());                 // '123.[3]'
n5.subtract('23 1/3').divide(2).add('48 2/1').divide(-100);
console.log(n5.toString());                 // '-1'

// Integer vs Fractional examples
var a=new Tpa(3);                           // Constructs a to be integer
var b=new Tpa(7.8);                         // Constructs b to be fractional
a.add(b);
console.log(a.toString());                  // '10' (a is an integer and ignores fractional operands)
var c=new Tpa(3,false);                     // Explicitly set a to be fractional
c.add(b);
console.log(c.toString());                  // '10.8' (c is fractional and so operates on fractional operands)
var d=new Tpa(b,true);                      // Explicitly set d to be integer
console.log(d.toString());                  // '7' (d was constructed to ignore any fractional part)
var e=new Tpa('23 100/23',true);            // Explicitly set e to be integer
console.log(e.value());                     // 27 (e took on the integer evaluation of the initialising string)
console.log(e.set(3,false).value());        // Sets an existing number to a new value and to be fractional

// Conversions
var a=new Tpa('33 2/3');
console.log(a.isInteger());                 // false
console.log(a.makeInteger().value());       // 33
console.log(a.isInteger());                 // true
var b=new Tpa(10);
console.log(b.makeFractional().subtract(11.5).value()); // -1.5
console.log(b.isFractional());                 // true
console.log(b.makeInteger().toDecimal());    // '-1'

// Simplification
var n=new Tpa('1/3');
n.multiply('3/5').multiply('9/7').multiply('23/45').multiply('12 45/87').divide('99.75');
console.log(n.toString(25));              // '0.0164924626838031038186599...'
console.log(n.toFraction());                // 0 67626900/4100473125
console.log(n.simplify());                  // true - indicates that simplification was fully achieved
console.log(n.toFraction());                // 0 11132/674975
n=new Tpa('234789789167435342333343/4239123411142533478912');
console.log(n.simplify());                  // false - defaults to 100 ms which is probably not enough time
console.log(n.toFraction());                // '55 1638001554596000993183/4239123411142533478912'
console.log(n.simplify(0));                 // true - achieved full simplification
console.log(n.toFraction());                // '55 1638001554596000993183/4239123411142533478912'

// Comparisons
var a=Tpa(3);
var b=Tpa(3.5);
var c=Tpa('4 1/4');
var d=Tpa('3 5/4');
var f=Tpa();
console.log(a.isZero());            // false
console.log(a.isPositive());        // true
console.log(f.isPositive());        // false
console.log(b.isNegative());        // false
console.log(a.lt(b));               // false (a is an integer and ignores fractional operands)
console.log(a.lt(c));               // true
console.log(d.lte(c));              // true (they are equal)
console.log(d.gte(c));              // true (ditto)
console.log(d.gt(c));               // false
console.log(d.eq(c));               // true

// Other methods
console.log(Tpa(-3).sign());                        // -1
console.log(Tpa(3.3).hasFraction());                // true
console.log(Tpa('-3 1/3').frac().toFraction());     // '-0 1/3'
console.log(Tpa('-3 1/3').int().toFraction());      // '-3'
console.log(Tpa(22).modulus(3).toString());             // '1'
console.log(Tpa(-33.5).abs().value());              // 33.5

// Static methods
var a=Tpa(5);
var b=Tpa(12.5,false);
console.log(Tpa.add(a,b).value());        // 17
console.log(Tpa.subtract(a,b).value());   // -7
console.log(Tpa.multiply(a,b).value());   // 60
console.log(Tpa.divide(b,a).toFraction());// '2 25/50'
console.log(Tpa.modulus(a,b).value());        // 5
console.log(Tpa.frac(b).value());         // 0.5
console.log(Tpa.int(b).value());          // 12
console.log(Tpa.abs(-23).value());        // 23

// Static vs in-place
var a=Tpa(100);
var b=Tpa(50);
Tpa.divide(a,b);         // Returns a new number = a/b, a and b remain unchanged
a.divide(b);             // Returns a having been divided by b, only b remains unchanged
