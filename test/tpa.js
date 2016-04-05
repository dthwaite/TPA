/*global describe, it*/
var assert = require('assert');
var Tpa = require('../');

alltests(); // Perform all tests on the standard base

if (process.env.ALL_BASES=='yes') {
    // Perform all the tests with 100 different bases which checks internal representational integrity
    for (var i = 0; i < 100; i++) {
        Tpa.setBASE(10 * (1 + i / 2) + Math.floor(Math.random() * Math.pow(2, i / 4)));
        alltests();
    }
}

function alltests() {
    describe('Tpa.js with BASE set to '+Tpa.getBASE(), function() {
        it('N - internal Number class, basic sanity checks', function() {
            assert.equal(new Tpa.N().isZero(), true, 'New N is zero');
            assert.equal(new Tpa.N().set(100).value(), 100, 'Set a small value');
            assert.equal(new Tpa.N().set(10000000000).value(), Math.pow(10, 10), 'Set a large value');
            var n = new Tpa.N().set(1000);
            n.reset();
            assert.equal(n.value(), 0, 'Reset value to be 0');
            assert.equal(n.set(Math.pow(10, 10)).add(new Tpa.N().set(Math.pow(10, 10))).value(), 2 * Math.pow(10, 10), 'Basic addition');
            assert.equal(n.subtract(new Tpa.N().set(Math.pow(10, 10))).value(), Math.pow(10, 10), 'Basic subtraction');
            n.set(Math.pow(10, 8));
            assert.equal(n.multiply(new Tpa.N().set(Math.pow(10, 3))).value(), Math.pow(10, 11), 'Basic multiplication');
            n.set(Math.pow(10, 8));
            assert.equal(n.divide(new Tpa.N().set(Math.pow(10, 4))).value(), 0, 'Basic division returns remainder');
            assert.equal(n.value(), Math.pow(10, 4), 'Result of division');
            assert.equal(Tpa.N(123).value(), 123, 'Static construction');
            var u;
            assert.equal(Tpa.N(u).value(), 0, 'Static construction with undefined');
            assert.throws(function() {
                new Tpa.N({});
            }, Error, 'Wrong argument to new N');
            assert.throws(function() {
                new Tpa.N('123f');
            }, Error, 'Bad string argument to new N');
        });

        describe('Instantiations', function() {
            it('Empty construction', function() {
                var n = new Tpa();
                assert.equal(n.value(), 0, 'Construction of an Tpa with no parameter should yield a zero value');
                assert.equal(Tpa(n), n, 'Static construction with exising Tpa should deliver back the same Tpa');
                assert.notEqual(new Tpa(n), n, 'New construction with an existing Tpa should deliver back a copy');
                assert.equal(n.isZero(), true, 'New empty Tpa should be set to zero');
                assert.equal(n.eq(new Tpa(n)), true, 'New construction with an existing Tpa should be equivalent');
                assert.equal(Tpa().isInteger(), true, 'Static empty construction should default to integer');
                assert.equal(Tpa(true).value(), 0, 'Static empty construction with explitely declared integer');
                assert.equal(new Tpa(true).value(), 0, 'New empty construction with explitely declared integer is zero');
                assert.equal(new Tpa(true).isInteger(), true, 'New empty construction with explitely declared integer');
                assert.equal(new Tpa(0, true).isInteger(), true, 'New 0 construction with explitely declared integer');
                assert.equal(new Tpa(true).isFractional(), false, 'New empty construction with explitely declared integer not fractional');
                assert.equal(new Tpa(0, true).isFractional(), false, 'New 0 construction with explitely declared integer not fractional');
                assert.equal(Tpa(false).isFractional(), true, 'Static empty fractional construction');
                assert.equal(new Tpa(false).isFractional(), true, 'New empty fractional construction');
                assert.equal(new Tpa(0, false).isFractional(), true, 'New 0 fractional construction is fractional');
                assert.equal(new Tpa(0, false).isInteger(), false, 'New 0 fractional construction is not integer');
                assert.equal(new Tpa(0, false).hasFraction(), false, 'New 0 fractional construction has no fraction');
                assert.equal(new Tpa(0, true).hasFraction(), false, 'New 0 integer construction has no fraction');
                assert.equal(Tpa().hasFraction(), false, 'Static empty construction has no fraction');
            });

            it('Construction from an Tpa', function() {
                var n = new Tpa(123);
                assert.equal(Tpa(n), n, 'Static construction yields same object');
                assert.notEqual(new Tpa(n), n, 'New construction yields new object');
                assert.equal(new Tpa(n).isFractional(), false, 'New construction is not fractional');
                assert.equal(new Tpa(n, false).isFractional(), true, 'New fractional construction is fractional');
                assert.notEqual(Tpa(n, false), n, 'Static fractional construction from an integer is different object');
                assert.equal(Tpa(n, true), n, 'Static integer construction from an integer is same object');
                n = new Tpa(123.123, false);
                assert.notEqual(Tpa(n, true), n, 'Static integer construction from a fractional is different object');
                assert.equal(Tpa(n, false), n, 'Static fractional construction from a fractional is same object');
                assert.equal(Tpa(n).isFractional(), true, 'Static implied integer construction from a fractional becomes fractional');
            });


            it('Integer, numeric construction', function() {
                assert.equal(new Tpa(0).value(), 0, 'Construction of an Tpa with numeric 0 parameter should yield a numeric value');
                assert.equal(new Tpa(123).value(), 123, 'Construction of an Tpa with numeric parameter should yield a numeric value');
                assert.throws(function() {
                    new Tpa(NaN);
                }, Error, 'Construction with NaN should fail');
                assert.equal(new Tpa(123.123).value(), 123.123, 'Fractional part accepted for non explicit integer');
                assert.equal(new Tpa(123.123).isFractional(), true, 'Fractional number for non explicit integer bcomes fractional');
                assert.equal(new Tpa(-123).value(), -123, 'Construction of negative number');
                assert.equal(Tpa(321).value(), 321, 'Static construction with positive number');
                assert.equal(Tpa(-1111).value(), -1111, 'Static construction with positive number');
                assert.equal(new Tpa(213, true).value(), 213, 'New construction with explitely declared integer');
                assert.equal(new Tpa(213, true).isInteger(), true, 'New construction with explitely declared integer is integer');
                assert.equal(new Tpa(213, true).isFractional(), false, 'New construction with explitely declared integer is not fractional');
                assert.equal(new Tpa(213, true).hasFraction(), false, 'New construction with explitely declared integer has no fraction');
                assert.equal(new Tpa(213).hasFraction(), false, 'New integer construction has no fraction');
            });

            it('Decimal, numeric construction', function() {
                assert.equal(Tpa(123.123, false).value(), 123.123, 'Fractional positive number construction value');
                assert.equal(Tpa(123.9, false).value(), 123.9, 'Fractional positive number construction value');
                assert.equal(Tpa(-1234, false).toString(), '-1234', 'Fractional positive number construction negative value');
                assert.equal(Tpa(-1234, false).isFractional(), true, 'Fractional negative number is fractional');
                assert.equal(Tpa(1234, false).isInteger(), false, 'Fractional positive number is not integer');
                assert.equal(Tpa(1234, false).hasFraction(), false, 'Fractional positive integer has no fraction');
                assert.equal(Tpa(1234.4321, false).hasFraction(), true, 'Fractional positive fraction has fraction');
                assert.equal(Tpa(1.123456789, false).value().toFixed(7), 1.1234568, 'small number with 9 significant figures');
                assert.equal(Tpa(123456789.123456789, false).value().toFixed(7), 123456789.1234568, 'large number with 9 significant figures');
                assert.equal(Tpa(12345678912345.123456789, false).value(), 12345678912345.123, 'larger number with 9 significant figures - loses some precision');
            });

            it('Integer, string construction', function() {
                assert.equal(new Tpa('0').value(), 0, 'Construction of an Tpa with numeric 0 parameter should yield a numeric value');
                assert.equal(new Tpa('123').value(), 123, 'Construction of an Tpa with numeric parameter should yield a numeric value');
                assert.equal(new Tpa('+123').value(), 123, 'Construction of an Tpa with nexplicit + sign');
                assert.equal(new Tpa('123.123').value(), 123.123, 'Fractional part accepted for implied integer construction');
                assert.equal(new Tpa('123.123', true).value(), 123, 'Fractional part ignored for explicit integer construction');
                assert.equal(new Tpa('123.123').isFractional(), true, 'Fractional construction implies fraction construction');
                assert.equal(new Tpa('-123').value(), -123, 'Construction of negative number');
                assert.equal(Tpa('321').value(), 321, 'Static construction with positive number');
                assert.equal(Tpa('-1111').value(), -1111, 'Static construction with positive number');
                assert.equal(new Tpa('213', true).value(), 213, 'New construction with explitely declared integer');
                assert.equal(new Tpa('213', true).isInteger(), true, 'New construction with explitely declared integer is integer');
                assert.equal(new Tpa('213', true).isFractional(), false, 'New construction with explitely declared integer is not fractional');
                assert.equal(new Tpa('213', true).hasFraction(), false, 'New construction with explitely declared integer has no fraction');
                assert.equal(new Tpa('213').hasFraction(), false, 'New integer construction has no fraction');
                assert.equal(Tpa('12345678901234567890').toString(), '12345678901234567890', 'Medium size number');
                assert.equal(Tpa('12345678901234567890123456789012345678901234567890123456789012345678901234567890').toString(),
                    '12345678901234567890123456789012345678901234567890123456789012345678901234567890', 'Large size number');
            });

            it('Bad format for string instantiation', function() {
                assert.throws(function() {
                    new Tpa('1-9');
                }, Error, 'Construction with +/- not at start should fail');
                assert.throws(function() {
                    new Tpa('+123s');
                }, Error, 'Construction with bad character should fail');
                assert.throws(function() {
                    new Tpa('+123..0');
                }, Error, 'Construction with multiple decimal points should fail');
                assert.throws(function() {
                    new Tpa('1.23.45');
                }, Error, 'Construction with multiple separate decimal points should fail');
                assert.throws(function() {
                    new Tpa('+-123.0');
                }, Error, 'Construction with plus and minus sign should fail');
                assert.throws(function() {
                    new Tpa('qwerty');
                }, Error, 'Construction bad characters should fail');
                assert.throws(function() {
                    new Tpa('125!');
                }, Error, 'Construction with exclamation mark in numerator should fail');
                assert.throws(function() {
                    new Tpa('125.!');
                }, Error, 'Construction with no decimals after exclamation mark should fail');
                assert.throws(function() {
                    new Tpa('125 3');
                }, Error, 'No denominator in fraction');
                assert.throws(function() {
                    new Tpa('125 /');
                }, Error, 'No numerator in fraction');
                assert.throws(function() {
                    new Tpa('125 /10');
                }, Error, 'No denominator in fraction');
                assert.throws(function() {
                    new Tpa('125 1.5/10');
                }, Error, 'Cannot have decimals in fractional numerator');
                assert.throws(function() {
                    new Tpa('125 1/.1');
                }, Error, 'Cannot have decimals in fractional denominator');
                assert.throws(function() {
                    new Tpa('125 3s2/12');
                }, Error, 'Bad character in fractional numerator');
                assert.throws(function() {
                    new Tpa('125 32/121!');
                }, Error, 'Bad character in fractional denominator');
                assert.throws(function() {
                    new Tpa('/12');
                }, Error, 'Fractional only number with no numerator');
                assert.throws(function() {
                    new Tpa('123/');
                }, Error, 'Fractional only number with no denominator');
                assert.throws(function() {
                    new Tpa('123.3[');
                }, Error, 'Decimal with incomplete recurring section');
                assert.throws(function() {
                    new Tpa('123.3[]');
                }, Error, 'Decimal with empty recurring section');
                assert.throws(function() {
                    new Tpa('123.3[123');
                }, Error, 'Decimal non terminated recurring section');
                assert.throws(function() {
                    new Tpa('123.3[123]4');
                }, Error, 'Decimal with digits after recurring section termination');
                assert.throws(function() {
                    new Tpa('+X');
                }, Error, 'no digits');
            });

            it('Decimal, string construction', function() {
                assert.equal(new Tpa('123.123').value(), 123.123, 'Fractional part accepted for implied integer construction');
                assert.equal(new Tpa('123.123', true).value(), 123, 'Fractional part ignored for explicit integer construction');
                assert.equal(new Tpa('123.123').isFractional(), true, 'Fractional construction implies fraction construction');
                assert.equal(new Tpa('.1234').value(), 0.1234, 'Fractional entry with leading decimal point');
                assert.equal(Tpa('123.123', false).value(), 123.123, 'Fractional positive number construction value');
                assert.equal(Tpa('123.9', false).value(), 123.9, 'Fractional positive number construction value');
                assert.equal(Tpa('-1234', false).value(), -1234, 'Fractional positive number construction negative value');
                assert.equal(Tpa('-1234', false).isFractional(), true, 'Fractional negative number is fractional');
                assert.equal(Tpa('1234', false).isInteger(), false, 'Fractional positive number is not integer');
                assert.equal(Tpa('1234', false).hasFraction(), false, 'Fractional positive integer has no fraction');
                assert.equal(Tpa('1234.4321', false).hasFraction(), true, 'Fractional positive fraction has fraction');
                assert.equal(Tpa('123456789000000000000.123456789', false).toString(), '123456789000000000000.123456789', 'very large number with 9 significant figures');
                assert.equal(Tpa('1.123456789', false).value().toFixed(7), 1.1234568, 'small number with 9 significant figures');
                assert.equal(Tpa('123456789.123456789', false).value().toFixed(7), 123456789.1234568, 'large number with 9 significant figures');
                assert.equal(Tpa('12345678912345.123456789', false).value(), 12345678912345.123, 'larger number with 9 significant figures value() not precise');
                assert.equal(Tpa('12345678912345.123456789', false).toString(), '12345678912345.123456789', 'larger number with 9 significant figures toString() precise');
                assert.equal(Tpa('123456789123456789123456789.123456789', false).toString(), '123456789123456789123456789.123456789', 'very large number with 9 significant figures');
                assert.equal(Tpa('0.1234567890123456789012345678901234567890123456789012345678901234567890123456789').toString(),
                    '0.1234567890123456789012345678901234567890123456789012345678901234567890123456789', 'very large number of decimal places');
            });

            it('Recurring decimals', function() {
                assert.equal(Tpa('3.[3]').toString(), '3.[3]', 'Immediate single recurring decimal');
                assert.equal(Tpa('100.[714285]').toString(), '100.[714285]', 'Immediate multiple recurring decimal');
                assert.equal(Tpa('123456.1234[5678]').toString(), '123456.1234[5678]', 'Multiple recurring decimal in a larger number');
                assert.equal(Tpa('1.35[45]').toString(), '1.3[54]', 'Subsequent multiple recurring decimal that is better expressed');
                assert.equal(Tpa('3.33[33]').toString(), '3.[3]', 'Tortuous 1/3 recurring decimal technically correct');
            });

            it('Fraction string construction', function() {
                assert.equal(Tpa('3 1/3').toString(), '3.[3]', 'Simple number with recurring fraction');
                assert.equal(Tpa('10 1/2').value(), 10.5, 'Simple number with fixed fraction');
                assert.equal(Tpa('100 255/256').value().toFixed(7), 100.9960938, 'Simple number with larger fraction');
                assert.equal(Tpa('1234567890 12345/23456').toString(), '1234567890.52630[4570259208731241473396998635743519781718963165075034106412005]', 'Number with large fraction');
                assert.equal(Tpa('123456789012334567890123456789012345678901234567890 12345/23456').toString(),
                    '123456789012334567890123456789012345678901234567890.52630[4570259208731241473396998635743519781718963165075034106412005]', 'Large number with large fraction');
                assert.equal(Tpa('100/50').value(), 2, 'Fractional only number yield integer');
                assert.equal(Tpa('12345/23456').toString(), '0.52630[4570259208731241473396998635743519781718963165075034106412005]', 'Complex fraction only');
                assert.equal(Tpa('300/250').toString(), '1.2', 'Small top-heavy fraction only');
                assert.equal(Tpa('12/5', true).value(), 2, 'Heavy fraction ignored if explicitly requesting integer');
                assert.equal(Tpa('123/1234', true).value(), 0, 'Fraction ignored if explicitly requesting integer');
                assert.equal(Tpa('-400/800', false).value(), -0.5, 'Negative fraction');
                assert.equal(Tpa('-400/800', true).value(), 0, 'Negative fraction into integer should yield zero');
                assert.equal(Tpa('-400/800', true).toString(), '0', 'Negative fraction into integer should yield non negative zero');
                assert.equal(Tpa('-500/100', false).value(), -5, 'Negative heavy fraction');
                assert.equal(Tpa('0/123').isZero(), true, 'Fractional 0 numerator yields 0');
                assert.throws(function() {
                    new Tpa('123/0');
                }, Error, 'Fractional denominator cannot be 0');
                assert.equal(Tpa('12345/23456').toString(10), '0.5263045702...', 'Complex fraction with 10 dp');
                assert.equal(Tpa('1/5').toString(1), '0.2', 'Small complete fraction to 1 dp');
                assert.equal(Tpa('1/4').toString(1), '0.2...', 'Small incomplete fraction to 1 dp');
                assert.equal(Tpa('1/4').toString(2), '0.25', 'Small complete fraction to 2 dp');
                assert.equal(Tpa('1/12').toString(), '0.08[3]', 'Small complete fraction');
                assert.equal(Tpa('31/53').toString(), '0.[5849056603773]', 'Random fraction');
                assert.equal(Tpa('22/7').toString(), '3.[142857]', 'Approximate pi');
                assert.equal(Tpa('123 75/10', true).value(), 130, 'Heavy fraction to increment number when integer specified');
                assert.equal(Tpa('1234567890 3643789784321/56775362176009173').toString(),
                    '1234567890.0000641790671986361876205495244404472559363618101197068047236294908717883604730777699331567969461966...', 'Large fraction yielding >100 dps');
                assert.equal(Tpa('1234567890 3643789784321/56775362176009173').toString(500),
                    '1234567890.00006417906719863618762054952444044725593636181011970680472362949087178836047307776993315679694619660708056797052818944839215647803655322557333237252375983543645408221639560724629465379272915374137866768669981920365636282010716204407451664060644431843730942730581824127866086110077887817226141150861384944681099492629019777481060062019764758533331679963636305390702816045575463861368815167908364799269665103997667880275452624398142479109218528907251530175326129507660434469194397461638379805376309981...', 'Large fraction yielding >500 dps');
                assert.equal(Tpa('1234567890 3643789784321/56775362176009173').value(), 1234567890.0000641, 'Large fraction to native value');
            });
        });

        describe('Miscellaneous functions', function() {
            it('Setting new values',function() {
                assert.equal(Tpa().set().value(), 0, 'reset an already reset number');
                assert.equal(Tpa(123).set().value(), 0, 'reset an already non zero number');
                assert.equal(Tpa(123).set(false).isFractional(), true, 'reset an Integer number to be fractional');
                assert.equal(Tpa(123.5).set(1.5,true).value(), 1, 'reset a fractional number to be integer');
                assert.equal(Tpa(123).set('100').value(), 100, 'reset a number to a new value');
                assert.equal(Tpa(123).set('100 1/4').value(), 100.25, 'reset a number to a new fractional value');
                assert.equal(Tpa(123).set('100',false).isFractional(), true, 'reset a number to a new integer value explicit set to fractional');
                var x=new Tpa(100);
                var y=Tpa(123).set(x);
                assert.equal(y.value(), 100, 'reset a number to that of another');
                assert.equal(y.set().isZero(), true, 'reset a number to be zero');
                assert.equal(x.value(), 100, 'Ensure a copied number was not changed');
                assert.equal(Tpa(123).int().value(),123,'Positive integer part of integer');
                assert.equal(Tpa(123.5).frac().value(),0.5,'Positive fractional part');
                assert.equal(Tpa(-123.5).frac().value(),-0.5,'Negative fractional part');
                assert.equal(Tpa(123.5).int().value(),123,'Positive integer part');
                assert.equal(Tpa(-123.5).int().value(),-123,'Negative iteger part');
                assert.equal(Tpa.frac(123.5).value(),0.5,'Static Positive fractional part');
                assert.equal(Tpa.frac(-123.5).value(),-0.5,'Static Negative fractional part');
                assert.equal(Tpa.int(123.5).value(),123,'Static Positive integer part');
                assert.equal(Tpa.int(-123.5).value(),-123,'Static Negative iteger part');
            });
            it('Status tests', function() {
                assert.equal(Tpa('123 3/4', true).isInteger(), true, 'isInteger for explicit integer');
                assert.equal(Tpa('123 3/4').isInteger(), false, 'isInteger for implied fraction');
                assert.equal(Tpa('123', false).isInteger(), false, 'isInteger for explicit fraction');
                assert.equal(Tpa('-123').isInteger(), true, 'isInteger for negative integer');
                assert.equal(Tpa('-123.5').isInteger(), false, 'isInteger for negative fraction');
                assert.equal(Tpa('123').isFractional(), false, 'isFractional for implied integer');
                assert.equal(Tpa('123 3/4', true).isFractional(), false, 'isFractional for explicit integer');
                assert.equal(Tpa('123 3/4').isFractional(), true, 'isFractional for implied fraction');
                assert.equal(Tpa('123', false).isFractional(), true, 'isFractional for explicit fraction');
                assert.equal(Tpa('-123').isFractional(), false, 'isFractional for negative integer');
                assert.equal(Tpa('-123.5').isFractional(), true, 'isFractional for negative fraction');
                assert.equal(Tpa('-123.5').hasFraction(), true, 'number has a fraction part');
                assert.equal(Tpa('123').hasFraction(), false, 'number has no fraction part');
                assert.equal(Tpa('123 10/5').hasFraction(), false, 'number has no fraction part');
                assert.equal(Tpa('123 1/126642').hasFraction(), true, 'number has small fraction part');
            });
            it('Absolute function',function() {
                assert.equal(Tpa(123).abs().value(),123,'abs on positive number');
                assert.equal(Tpa(0).abs().value(),0,'abs on zero number');
                assert.equal(Tpa(-123).abs().value(),123,'abs on negative integer');
                assert.equal(Tpa('-123 3/4').abs().value(),123.75,'abs on negative fraction');
                assert.equal(Tpa.abs(-123).value(),123,'abs on static method');
            });
            it('Zero, negative and positive checks', function() {
                assert.equal(Tpa().isZero(), true, 'isZero for zero number');
                assert.equal(Tpa(12).isZero(), false, 'isZero for integer');
                assert.equal(Tpa('12 3/4').isZero(), false, 'isZero for fraction');
                assert.equal(Tpa('0.1234').isZero(), false, 'isZero for fraction<1');
                assert.equal(Tpa('123').isInteger(), true, 'isInteger for implied integer');
                assert.equal(Tpa('-123.5').isNegative(), true, 'isNegative for negative fraction');
                assert.equal(Tpa('-4').isNegative(), true, 'isNegative for negative integer');
                assert.equal(Tpa(0).isNegative(), false, 'isNegative for zero');
                assert.equal(Tpa(55).isNegative(), false, 'isNegative for positive integer');
                assert.equal(Tpa('4/12').isNegative(), false, 'isNegative for positive fraction<1');
                assert.equal(Tpa('-4/12').isNegative(), true, 'isNegative for negative fraction>-1');
                assert.equal(Tpa('-123.5').isPositive(), false, 'isPositive for negative fraction');
                assert.equal(Tpa('-4').isPositive(), false, 'isPositive for negative integer');
                assert.equal(Tpa(0).isPositive(), false, 'isPositive for zero');
                assert.equal(Tpa(55).isPositive(), true, 'isPositive for positive integer');
                assert.equal(Tpa('4/12').isPositive(), true, 'isPositive for positive fraction<1');
                assert.equal(Tpa('-4/12').isPositive(), false, 'isPositive for negative fraction>-1');
            });
            it('Miscellaneous',function() {
                var r1=Math.ceil(Math.log(Tpa.random(2).value())/Math.log(10));
                var r2=Math.ceil(Math.log(Tpa.random(10).value())/Math.log(10));
                assert.equal(r1>=1 && r1<=3,true,'Create a 2 digit random number');
                assert.equal(r2>=9 && r2<=11,true,'Create a 10 digit random number');
                assert.equal(Tpa(100).toFraction(),'100','fractional output of an integer');
                assert.throws(function() {
                    Tpa.random();
                }, Error, 'Must pass a parameter to random()');
                assert.throws(function() {
                    Tpa.random(NaN);
                }, Error, 'NaN passed into random()');
                assert.throws(function() {
                    new Tpa('125 1/.1').toString('asd');
                }, Error, 'Bad parameter to the toString function');
                assert.throws(function() {
                    new Tpa('125 1/.1').toString(parseInt('d123'));
                }, Error, 'Nan to the toString function');
                assert.throws(function() {
                    Tpa(123.4).toDecimal('qwe');
                }, Error, 'Bad argument to toDecimal');
            });
            it('Status changes', function() {
                var n = Tpa(123);
                assert.equal(n.isInteger(), true, 'isInteger for implicit integer');
                n.add(.5);
                assert.equal(n.value(), 123, 'Fractional change has no effect');
                n.makeFractional();
                assert.equal(n.isFractional(), true, 'isInteger for implicit integer');
                n.add(.5);
                assert.equal(n.value(), 123.5, 'Fractional change has effect');
                n.makeInteger();
                assert.equal(n.isFractional(), false, 'isInteger for implicit integer');
                assert.equal(n.value(), 123, 'Integer change has effect');
                assert.equal(Tpa('-123 3/4').abs().toFraction(),'123 3/4','Absolute of a negative fraction');
                assert.equal(Tpa('-1000').abs().toString(),'1000','Absolute of a negative number');
                assert.equal(Tpa('1.5').abs().value(),1.5,'Absolute of a positive number');
                assert.equal(Tpa.makeFractional(Tpa(123)).isFractional(),true,'Static make fractional');
                assert.equal(Tpa.makeInteger(Tpa(123.5)).isInteger(),true,'Static make integer');
                assert.equal(Tpa.makeFractional(Tpa(123.5)).value(),123.5,'Static make fraction on fraction');
            });
        });

        describe('Comparisons', function() {
            it('Equals for integers', function() {
                assert.throws(function() {
                    new Tpa(1).eq();
                }, Error, 'Must pass something into eq()');
                assert.equal(Tpa().eq(0), true, 'Empty constructor yields zero number');
                assert.equal(Tpa(5).eq(5), true, 'Two equal integers');
                assert.equal(Tpa(5).eq(6), false, 'Two unequal integers');
                assert.equal(Tpa('1234567890123456789012345678901234567890').eq('1234567890123456789012345678901234567890'), true, 'Two large equal integers');
                assert.equal(Tpa('1234567890123456789012345678901234567890').eq('1234567890123456789012345678901234567891'), false, 'Two large unequal integers');
                assert.equal(Tpa('-1234567890123456789012345678901234567890').eq('-1234567890123456789012345678901234567890'), true, 'Two large equal negative integers');
                assert.equal(Tpa(5).eq(-5), false, 'Two equal integers of different sign, first positive');
                assert.equal(Tpa(-1000).eq(+1000), false, 'Two equal integers of different sign, second positive');
            });
            it('Equals for fractions', function() {
                assert.equal(Tpa(5).eq(5.123), true, 'Implied integer ignores fraction of comparator');
                assert.equal(Tpa(5, false).eq(5.123), false, 'Explicit fractional integer uses fraction of comparator');
                assert.equal(Tpa(5.5).eq(5.5), true, 'Two equal decimals');
                assert.equal(Tpa(5.5).eq(5.25), false, 'Two unequal decimals');
                assert.equal(Tpa('5 4234/3245667').eq('5 4234/3245667'), true, 'Two equal complex decimals');
                assert.equal(Tpa('5 4234/3245667').eq('5 4234/3245668'), false, 'Two unequal complex decimals');
            });
            describe('Other comparitor functions', function() {
                it('Less than', function() {
                    assert.throws(function() {
                        new Tpa(1).lt();
                    }, Error, 'Must pass something into lt()');
                    assert.equal(Tpa().lt(5),true,'zero and positive');
                    assert.equal(Tpa().lt(0),false,'zero and zero');
                    assert.equal(Tpa().lt(-5),false,'zero and negative');
                    assert.equal(Tpa(5).lt(0),false,'positive and zero');
                    assert.equal(Tpa(-5).lt(0),true,'negative and zero');
                    assert.equal(Tpa(5).lt(5), false, 'Two equal numbers');
                    assert.equal(Tpa(5).lt(-5), false, 'Two equal opposite sign numbers - second negative');
                    assert.equal(Tpa(-5).lt(5), true, 'Two equal opposite sign numbers - first negative');
                    assert.equal(Tpa(4).lt(5), true, 'Two integers - first smaller');
                    assert.equal(Tpa(5).lt(4), false, 'Two integers - second smaller');
                    assert.equal(Tpa(5.5).lt(6), true, 'Fraction and integer - first smaller');
                    assert.equal(Tpa(6, false).lt(5.5), false, 'Fraction and integer - second smaller');
                    assert.equal(Tpa(6.25).lt(6.35), true, 'Two fractions with integer value equal');
                    assert.equal(Tpa('6 123/400').lt('6 124/400'), true, 'Two larger fractions with integer value equal - first smaller');
                    assert.equal(Tpa('6 124/400').lt('6 123/400'), false, 'Two larger fractions with integer value equal - second smaller');
                    assert.equal(Tpa('6 125/400').lt('6 125/400'), false, 'Two larger equal fractions');
                    assert.equal(Tpa('-6 125/400').lt('6 125/400'), true, 'Two larger equal fractions - first negative');
                });
                it('Less than or equal', function() {
                    assert.throws(function() {
                        new Tpa(1).lte();
                    }, Error, 'Must pass something into lte()');
                    assert.equal(Tpa(5).lte(5), true, 'Two equal numbers');
                    assert.equal(Tpa(5).lte(-5), false, 'Two equal opposite sign numbers - second negative');
                    assert.equal(Tpa(-5).lte(5), true, 'Two equal opposite sign numbers - first negative');
                    assert.equal(Tpa(4).lte(5), true, 'Two integers - first smaller');
                    assert.equal(Tpa(5).lte(4), false, 'Two integers - second smaller');
                    assert.equal(Tpa(5.5).lte(6), true, 'Fraction and integer - first smaller');
                    assert.equal(Tpa(6, false).lte(5.5), false, 'Fraction and integer - second smaller');
                    assert.equal(Tpa(6.25).lte(6.35), true, 'Two fractions with integer value equal');
                    assert.equal(Tpa('6 123/400').lte('6 124/400'), true, 'Two larger fractions with integer value equal - first smaller');
                    assert.equal(Tpa('6 124/400').lte('6 123/400'), false, 'Two larger fractions with integer value equal - second smaller');
                    assert.equal(Tpa('6 125/400').lte('6 125/400'), true, 'Two larger equal fractions');
                    assert.equal(Tpa('-6 125/400').lte('6 125/400'), true, 'Two larger equal fractions - first negative');
                });
                it('Greater than', function() {
                    assert.throws(function() {
                        new Tpa(1).gt();
                    }, Error, 'Must pass something into gt()');
                    assert.equal(Tpa().gt(5),false,'zero and positive');
                    assert.equal(Tpa().gt(0),false,'zero and zero');
                    assert.equal(Tpa().gt(-5),true,'zero and negative');
                    assert.equal(Tpa(5).gt(0),true,'positive and zero');
                    assert.equal(Tpa(-5).gt(0),false,'negative and zero');
                    assert.equal(Tpa(5).gt(5), false, 'Two equal numbers');
                    assert.equal(Tpa(5).gt(-5), true, 'Two equal opposite sign numbers - second negative');
                    assert.equal(Tpa(-5).gt(5), false, 'Two equal opposite sign numbers - first negative');
                    assert.equal(Tpa(4).gt(5), false, 'Two integers - first smaller');
                    assert.equal(Tpa(5).gt(4), true, 'Two integers - second smaller');
                    assert.equal(Tpa(5.5).gt(6), false, 'Fraction and integer - first smaller');
                    assert.equal(Tpa(6, false).gt(5.5), true, 'Fraction and integer - second smaller');
                    assert.equal(Tpa(6.25).gt(6.35), false, 'Two fractions with integer value equal');
                    assert.equal(Tpa('6 123/400').gt('6 124/400'), false, 'Two larger fractions with integer value equal - first smaller');
                    assert.equal(Tpa('6 124/400').gt('6 123/400'), true, 'Two larger fractions with integer value equal - second smaller');
                    assert.equal(Tpa('6 125/400').gt('6 125/400'), false, 'Two larger equal fractions');
                    assert.equal(Tpa('-6 125/400').gt('6 125/400'), false, 'Two larger equal fractions - first negative');
                });
                it('Greater than or equal', function() {
                    assert.throws(function() {
                        new Tpa(1).gte();
                    }, Error, 'Must pass something into gte()');
                    assert.equal(Tpa().eq(5),false,'zero and positive');
                    assert.equal(Tpa().eq(0),true,'zero and zero');
                    assert.equal(Tpa().eq(-5),false,'zero and negative');
                    assert.equal(Tpa(5).eq(0),false,'positive and zero');
                    assert.equal(Tpa(-5).eq(0),false,'negative and zero');
                    assert.equal(Tpa(5).gte(5), true, 'Two equal numbers');
                    assert.equal(Tpa(5).gte(-5), true, 'Two equal opposite sign numbers - second negative');
                    assert.equal(Tpa(-5).gte(5), false, 'Two equal opposite sign numbers - first negative');
                    assert.equal(Tpa(4).gte(5), false, 'Two integers - first smaller');
                    assert.equal(Tpa(5).gte(4), true, 'Two integers - second smaller');
                    assert.equal(Tpa(5.5).gte(6), false, 'Fraction and integer - first smaller');
                    assert.equal(Tpa(6, false).gte(5.5), true, 'Fraction and integer - second smaller');
                    assert.equal(Tpa(6.25).gte(6.35), false, 'Two fractions with integer value equal');
                    assert.equal(Tpa('6 123/400').gte('6 124/400'), false, 'Two larger fractions with integer value equal - first smaller');
                    assert.equal(Tpa('6 124/400').gte('6 123/400'), true, 'Two larger fractions with integer value equal - second smaller');
                    assert.equal(Tpa('6 125/400').gte('6 125/400'), true, 'Two larger equal fractions');
                    assert.equal(Tpa('-6 125/400').gte('6 125/400'), false, 'Two larger equal fractions - first negative');
                });
                it('Compare',function() {
                    assert.equal(Tpa(2).compare(2),0,'compare integers equal numbers');
                    assert.equal(Tpa(5).compare(2),1,'compare integers greater than');
                    assert.equal(Tpa(2).compare(5),-1,'compare integers less than');
                    assert.equal(Tpa(2).compare(2.5),0,'compare integer with fraction equal');
                    assert.equal(Tpa(2).compare(3.5),-1,'compare integer with fraction greater than');
                    assert.equal(Tpa(3.5).compare(3),0,'compare fraction with integer equal');
                    assert.equal(Tpa(3.5).compare(Tpa(3,false)),1,'compare fraction with integer forced fraction greater than');
                    assert.equal(Tpa(3.5).compare(2),1,'compare fraction with integer greater than');
                    assert.equal(Tpa(3.5).compare(3.5),0,'compare fraction with fraction equal');
                    assert.equal(Tpa(3.6).compare(3.5),1,'compare fraction with fraction greater than');
                    assert.equal(Tpa(3.6).compare(3.7),-1,'compare fraction with fraction less than');
                });
            });
        });

        describe('Addition', function() {
            it('Add various positive integers', function() {
                assert.throws(function() {
                    new Tpa(1).add();
                }, Error, 'Must pass something into add()');
                assert.equal(Tpa(1).add(0).value(), 1);
                assert.equal(Tpa(1).add(1).value(), 2);
                assert.equal(Tpa(8).add(8).value(), 16);
                assert.equal(Tpa(27).add(73).value(), 100);
                assert.equal(Tpa(99).add(10001).value(), 10100);
                assert.equal(Tpa(517).add(0).value(), 517);
                assert.equal(Tpa(2).add(Tpa(5999)).value(), 6001);
                assert.equal(Tpa(517).add(0).value(), 517);
                assert.equal(Tpa(517).add(5).value(), 522);
                assert.equal(Tpa(517).add(925).value(), 1442);
                assert.equal(Tpa(29100517).add(925).value(), 29101442);
                assert.equal(Tpa(9773).add(227).value(), 10000);
                assert.equal(Tpa(199773).add(227).value(), 200000);
            });

            it('Consistency', function() {
                var n = Tpa(123);
                assert.equal((Tpa.add(n, 5), n.value()), 123, 'Static add call should not modify first parameter');
                assert.equal((Tpa.add(1000, n), n.value()), 123, 'Static add call should not modify second parameter');
                assert.equal((Tpa(1000).add(n), n.value()), 123, 'Method add call should not modify operand');
                var x = Tpa(1000);
                assert.equal((x.add(n), x.value()), 1123, 'Method add call should modify the calling number');
                assert.equal(x.add(x), 2246, 'Add the same number object');
            });

            it('Add a mixture of negative and positive integers', function() {
                assert.equal(Tpa(1).add(-1).value(), 0);
                assert.equal(Tpa(1).add(-7).value(), -6);
                assert.equal(Tpa(1).add(-100).value(), -99);
                assert.equal(Tpa(-121).add(-1).value(), -122);
                assert.equal(Tpa(-121).add(22).value(), -99);
                assert.equal(Tpa(-121).add(1105).value(), 984);
                assert.equal(Tpa(-5).add(-99).value(), -104);
            });

            it('Add positive mixed fractions', function() {
                assert.equal(Tpa('1 1/10').add('1').value(), 2.1, 'Simple fraction+integer');
                assert.equal(Tpa('1').add('1 2/10').value(), 2, 'Assumed integer will ignore fractional operand');
                assert.equal(Tpa('1', false).add('1 2/10').value(), 2.2, 'Explicit fraction will include fractional operand');
                assert.equal(Tpa('1 3/10').add('1 2/10').value(), 2.5, 'Simple fraction+fraction');
                assert.equal(Tpa('1 8/10').add('1 2/10').value(), 3, 'Simple fraction+fraction to yield integer');
                assert.equal(Tpa('1 15/10').add('1 2/10').value(), 3.7, 'Simple heavy fraction+fraction');
            });

            it('Add positive & negative mixed fractions', function() {
                assert.equal(Tpa('1 1/10').add('-1').value(), 0.1, 'Simple fraction minus integer');
                assert.equal(Tpa('1 1/10').add('-2', false).value(), -0.9, 'Simple fraction minus integer to yield negative number');
                assert.equal(Tpa('1').add('-1 2/10').value(), 0, 'Simple integer minus ignored fraction');
                assert.equal(Tpa('1').add('-1 12/10').value(), -1, 'Simple integer minus heavy ignored fraction');
                assert.equal(Tpa('1', false).add('-1 12/10').value(), -1.2, 'Explicit fraction will include fractional operand');
                assert.equal(Tpa('1 3/10').add('-1 2/10').value(), .1, 'Simple fraction-smaller fraction');
                assert.equal(Tpa('4 3/10').add('-1 8/10').value(), 2.5, 'Simple fraction-larger fraction to yield positive number');
                assert.equal(Tpa('1 3/10').add('-1 8/10').value(), -.5, 'Simple fraction-larger fraction to yield negative number');
            });

            it('Add positive & negative mixed fractions, other way around', function() {
                assert.equal(Tpa('-1', false).add('1 1/10').value(), 0.1, 'Simple fraction minus integer');
                assert.equal(Tpa('-2', false).add('1 1/10', false).value(), -0.9, 'Simple fraction minus integer to yield negative number');
                assert.equal(Tpa('-1 2/10').add('1').value(), -.2, 'Negative fraction adding integer to yield negative number');
                assert.equal(Tpa('-1 12/10').add('1').value(), -1.2, 'Negative heavy fraction adding integer to yield negative number');
                assert.equal(Tpa('-1 12/10').add('1', false).value(), -1.2, 'Explicit fraction for integer operand');
                assert.equal(Tpa('-1 2/10').add('1 3/10').value(), .1, 'Simple fraction-smaller fraction');
                assert.equal(Tpa('-1 8/10').add('4 3/10').value(), 2.5, 'Simple fraction-larger fraction to yield positive number');
                assert.equal(Tpa('-1 8/10').add('1 3/10').value(), -.5, 'Simple fraction-larger fraction to yield negative number');
            });

            it('Add positive and negative decimal numbers', function() {
                assert.equal(Tpa(123.123).add(321.321).value(), 444.444, 'Addition of two positive numbers');
                assert.equal(Tpa(100.5).add(-100.2).value(), 0.3, 'Addition of a positive and negative number');
                assert.equal(Tpa(-100.5).add(100.2).value(), -0.3, 'Addition of a negative and positive number to yield a negative number');
                assert.equal(Tpa(100).add(1.12345).value(), 101, 'Addition of integer to decimal which should be ignored');
                assert.equal(Tpa(100, false).add(1.12345).toString(), '101.12345', 'Addition of explicit fraction integer to decimal');
                assert.equal(Tpa(100, false).add(-99.5).toString(), '0.5', 'Subtraction of explicit fraction integer to decimal to yield positive');
                assert.equal(Tpa(100, false).add(-100.5).toString(), '-0.5', 'Subtraction of explicit fraction integer to decimal to yield negative');
                assert.equal(Tpa(0.12345).add(0.12344).value(), 0.24689, 'Addition of two significant decimals');
                assert.equal(Tpa(0.11).add(-0.01).value(), 0.1, 'Subtraction of two significant decimals to small positive');
                assert.equal(Tpa(100.987).add(-101.123456).value(), -0.136456, 'Subtraction of two significant decimals to small negative');
                assert.equal(Tpa(1.36784571).add(1.2394362).value().toFixed(7), 2.6072819, 'Addition of two longer decimals');
                assert.equal(Tpa(10.36784571).add(-9.06784571).value(), 1.3, 'Addition of two longer decimals yielding positive');
                assert.equal(Tpa(10.36784571).add(-11.06784571).value(), -.7, 'Addition of two longer decimals yielding negative');
            });

            it('Add various larger numbers', function() {
                assert.equal(Tpa('123456789').add('987654321').toString(), '1111111110', 'normal number addition');
                assert.equal(Tpa('123456789123456789').add('987654321987654321').toString(), '1111111111111111110', 'normal larger number addition');
                assert.equal(Tpa('1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111').add(
                    '2222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222').toString(),
                    '3333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333', '100 digit number addition');
                assert.equal(Tpa('43216789895328312675790036721362674782378923750950234212368965373910384654').add(
                    '85764636478697019837453424264758699685764562524345456576868').toString(),
                    '43216789895328398440426515418382512235803188509649919976931489719366961522', 'Random very large number');
                assert.equal(Tpa('43216789895328312675790036721362674782378923750950234212368965373910384654').add(
                    '-85764636478697019837453424264758699685764562524345456576868').toString(),
                    '43216789895328226911153558024342837328954658992250548447806441028453807786', 'Random very large positive and negative number');
                assert.equal(Tpa('-43216789895328312675790036721362674782378923750950234212368965373910384654').add(
                    '+85764636478697019837453424264758699685764562524345456576868').toString(),
                    '-43216789895328226911153558024342837328954658992250548447806441028453807786', 'Random very large negative and positive number');
                var x = Tpa.random(1000);
                var y = Tpa.random(1000);
                assert.equal(x.add(y).subtract(y).eq(x), true, 'Adding and subtracting the same 1000 digit number yields the initial number');
            });
        });

        describe('subtraction - same tests as for addition', function() {
            it('Subtract various positive integers', function() {
                assert.throws(function() {
                    new Tpa(1).subtract();
                }, Error, 'Must pass something into subtract()');
                assert.equal(Tpa(1).subtract(0).value(), 1);
                assert.equal(Tpa(1).subtract(1).value(), 0);
                assert.equal(Tpa(8).subtract(8).value(), 0);
                assert.equal(Tpa(27).subtract(73).value(), -46);
                assert.equal(Tpa(99).subtract(10001).value(), -9902);
                assert.equal(Tpa(517).subtract(0).value(), 517);
                assert.equal(Tpa(2).subtract(Tpa(5999)).value(), -5997);
                assert.equal(Tpa(517).subtract(0).value(), 517);
                assert.equal(Tpa(517).subtract(5).value(), 512);
                assert.equal(Tpa(517).subtract(925).value(), -408);
                assert.equal(Tpa(29100517).subtract(925).value(), 29099592);
                assert.equal(Tpa(9773).subtract(227).value(), 9546);
                assert.equal(Tpa(199773).subtract(227).value(), 199546);
            });

            it('Consistency', function() {
                var n = Tpa(123);
                assert.equal((Tpa.subtract(n, 5), n.value()), 123, 'Static subtract call should not modify first parameter');
                assert.equal((Tpa.subtract(1000, n), n.value()), 123, 'Static subtract call should not modify second parameter');
                assert.equal((Tpa(1000).subtract(n), n.value()), 123, 'Method subtract call should not modify operand');
                var x = Tpa(1000);
                assert.equal((x.subtract(n), x.value()), 877, 'Method subtract call should modify the calling number');
                assert.equal(x.subtract(x), 0, 'Subtract the same number object');
            });

            it('Subtract a mixture of negative and positive integers', function() {
                assert.equal(Tpa(1).subtract(-1).value(), 2);
                assert.equal(Tpa(1).subtract(-7).value(), 8);
                assert.equal(Tpa(1).subtract(-100).value(), 101);
                assert.equal(Tpa(-121).subtract(-1).value(), -120);
                assert.equal(Tpa(-121).subtract(22).value(), -143);
                assert.equal(Tpa(-121).subtract(1105).value(), -1226);
                assert.equal(Tpa(-5).subtract(-99).value(), 94);
            });

            it('Subtract positive mixed fractions', function() {
                assert.equal(Tpa('1 1/10').subtract('1').value(), 0.1, 'Simple fraction+integer');
                assert.equal(Tpa('1').subtract('1 2/10').value(), 0, 'Assumed integer will ignore fractional operand');
                assert.equal(Tpa('1', false).subtract('1 2/10').value(), -0.2, 'Explicit fraction will include fractional operand');
                assert.equal(Tpa('1 3/10').subtract('1 2/10').value(), 0.1, 'Simple fraction+fraction');
                assert.equal(Tpa('1 8/10').subtract('1 2/10').value(), 0.6, 'Simple fraction+fraction to yield integer');
                assert.equal(Tpa('1 15/10').subtract('1 2/10').value(), 1.3, 'Simple heavy fraction+fraction');
            });

            it('Subtract positive & negative mixed fractions', function() {
                assert.equal(Tpa('1 1/10').subtract('-1').value(), 2.1, 'Simple fraction minus integer');
                assert.equal(Tpa('1 1/10').subtract('-2', false).value(), 3.1, 'Simple fraction minus integer to yield negative number');
                assert.equal(Tpa('1').subtract('-1 2/10').value(), 2, 'Simple integer minus ignored fraction');
                assert.equal(Tpa('1').subtract('-1 12/10').value(), 3, 'Simple integer minus heavy ignored fraction');
                assert.equal(Tpa('1', false).subtract('-1 12/10').value(), 3.2, 'Explicit fraction will include fractional operand');
                assert.equal(Tpa('1 3/10').subtract('-1 2/10').value(), 2.5, 'Simple fraction-smaller fraction');
                assert.equal(Tpa('4 3/10').subtract('-1 8/10').value(), 6.1, 'Simple fraction-larger fraction to yield positive number');
                assert.equal(Tpa('1 3/10').subtract('-1 8/10').value(), 3.1, 'Simple fraction-larger fraction to yield negative number');
            });

            it('Subtract positive & negative mixed fractions, other way around', function() {
                assert.equal(Tpa('-1', false).subtract('1 1/10').value(), -2.1, 'Simple fraction minus integer');
                assert.equal(Tpa('-2', false).subtract('1 1/10', false).value(), -3.1, 'Simple fraction minus integer to yield negative number');
                assert.equal(Tpa('-1 2/10').subtract('1').value(), -2.2, 'Negative fraction subtracting integer to yield negative number');
                assert.equal(Tpa('-1 12/10').subtract('1').value(), -3.2, 'Negative heavy fraction subtracting integer to yield negative number');
                assert.equal(Tpa('-1 12/10').subtract('1', false).value(), -3.2, 'Explicit fraction for integer operand');
                assert.equal(Tpa('-1 2/10').subtract('1 3/10').value(), -2.5, 'Simple fraction-smaller fraction');
                assert.equal(Tpa('-1 8/10').subtract('4 3/10').value(), -6.1, 'Simple fraction-larger fraction to yield positive number');
                assert.equal(Tpa('-1 8/10').subtract('1 3/10').value(), -3.1, 'Simple fraction-larger fraction to yield negative number');
            });

            it('Subtract positive and negative decimal numbers', function() {
                assert.equal(Tpa(123.123).subtract(321.321).value(), -198.198, 'Two positive numbers');
                assert.equal(Tpa(100.5).subtract(-100.2).value(), 200.7, 'Positive and negative number');
                assert.equal(Tpa(-100.5).subtract(100.2).value(), -200.7, 'Negative and positive number to yield a negative number');
                assert.equal(Tpa(100).subtract(1.12345).value(), 99, 'Integer to decimal which should be ignored');
                assert.equal(Tpa(100, false).subtract(1.12345).toString(), '98.87655', 'Explicit fraction integer to decimal');
                assert.equal(Tpa(100, false).subtract(-99.5).toString(), '199.5', 'Explicit fraction integer to decimal to yield positive');
                assert.equal(Tpa(100, false).subtract(-100.5).toString(), '200.5', 'Explicit fraction integer to decimal to yield negative');
                assert.equal(Tpa(0.12345).subtract(0.12344).toString(), '0.00001', 'Two significant decimals');
                assert.equal(Tpa(0.11).subtract(-0.01).value(), 0.12, 'Two significant decimals to small positive');
                assert.equal(Tpa(100.987).subtract(-101.123456).value(), 202.110456, 'Two significant decimals to small negative');
                assert.equal(Tpa(1.36784571).subtract(1.2394362).value().toFixed(7), 0.1284095, 'Two longer decimals');
                assert.equal(Tpa(10.36784571).subtract(-9.06784571).value().toFixed(7), 19.4356914, 'Two longer decimals yielding positive');
                assert.equal(Tpa(10.36784571).subtract(-11.06784571).value().toFixed(7), 21.4356914, 'Two longer decimals yielding negative');
            });

            it('Subtract various larger numbers', function() {
                assert.equal(Tpa('123456789').subtract('987654321').toString(), '-864197532', 'normal number subtractition');
                assert.equal(Tpa('123456789123456789').subtract('987654321987654321').toString(), '-864197532864197532', 'normal larger number subtractition');
                assert.equal(Tpa('1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111').subtract(
                    '2222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222').toString(),
                    '-1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111', '100 digit number subtractition');
                assert.equal(Tpa('43216789895328312675790036721362674782378923750950234212368965373910384654').subtract(
                    '85764636478697019837453424264758699685764562524345456576868').toString(),
                    '43216789895328226911153558024342837328954658992250548447806441028453807786', 'Random very large number');
                assert.equal(Tpa('43216789895328312675790036721362674782378923750950234212368965373910384654').subtract(
                    '-85764636478697019837453424264758699685764562524345456576868').toString(),
                    '43216789895328398440426515418382512235803188509649919976931489719366961522', 'Random very large positive and negative number');
                assert.equal(Tpa('-43216789895328312675790036721362674782378923750950234212368965373910384654').subtract(
                    '+85764636478697019837453424264758699685764562524345456576868').toString(),
                    '-43216789895328398440426515418382512235803188509649919976931489719366961522', 'Random very large negative and positive number');
                var x = Tpa.random(1000);
                var y = Tpa.random(1000);
                assert.equal(x.subtract(y).add(y).eq(x), true, 'Adding and subtracting the same 1000 digi number yields the initial number');
            });
        });

        describe('Multiplication', function() {
            it('Various integers', function() {
                assert.equal(Tpa(1).multiply(0).value(), 0, 'Multiplication by zero yields zero');
                assert.equal(Tpa(123).multiply(1).value(), 123, 'Multiplication by one yields same number');
                assert.equal(Tpa(123).multiply(2).value(), 246, 'Multiplication by two doubles number');
            });

            it('Consistency', function() {
                var n = Tpa(123);
                assert.equal((Tpa.multiply(n, 5), n.value()), 123, 'Static divide call should not modify first parameter');
                assert.equal((Tpa.multiply(1000, n), n.value()), 123, 'Static divide call should not modify second parameter');
                assert.equal((Tpa(1000).multiply(n), n.value()), 123, 'Method mod call should not modify operand');
                var x = Tpa(1000);
                assert.equal((x.multiply(n), x.value()), 123000, 'Method divide call should modify the calling number');
                assert.equal(x.multiply(x), 15129000000, 'Multiply the same number object');
            });

            it('Various fractions', function() {
                assert.equal(Tpa(1.5).multiply(2).value(), 3, 'Multiplication by simple fraction to yield integer');
                assert.equal(Tpa(1).multiply(2.5).value(), 2, 'Multiplication of implied integer by a fraction should ignore fraction');
                assert.equal(Tpa(3, false).multiply(2.5).value(), 7.5, 'Multiplication of explicit fractional integer by a fraction should use fraction');
                assert.equal(Tpa(10.0).multiply(3.5).value(), 30, 'Multiplication of one fraction and one implied integer should ignore fraction');
                assert.equal(Tpa(1.5).multiply(1.5).value(), 2.25, 'Multiplication of two identical fractions');
                assert.equal(Tpa(1.5).multiply(3.5).value(), 5.25, 'Multiplication of two different fractions');
                assert.equal(Tpa('1 7/12').multiply('13 20/13').toString(), '23.01[923076]', 'Multiplication of two more complex fractions');
            });

            it('Negative and positive combinations', function() {
                assert.equal(Tpa(123).multiply(-5).value(), -615, 'Simple multiplication with one negative number');
                assert.equal(Tpa(-123).multiply(-5).value(), 615, 'Simple multiplication with two negative numbers');
                assert.equal(Tpa(-10.5).multiply(2).value(), -21, 'Simple multiplication with first negative fraction');
                assert.equal(Tpa(11, false).multiply('-5 3/4').value(), -63.25, 'Simple multiplication with second negative fraction');
                assert.equal(Tpa(-100.5, false).multiply('-3.7').value(), 371.85, 'Simple multiplication with both negative fractions');
            });

            it('Larger numbers', function() {
                assert.equal(Tpa('1234567890').multiply(Tpa('98765432198654321987654321')).toString(), '121932631234430727135679001126352690', 'Larger numbers smaller/larger');
                assert.equal(Tpa('98765432198654321987654321').multiply(Tpa('1234567890')).toString(), '121932631234430727135679001126352690', 'Larger numbers larger/smaller');
                var a = Tpa('6721807898352 12421331/1233490');
                var b = Tpa('6464929372516485923 423245/8651732749');
                var c = Tpa.multiply(a, b);
                var d = Tpa.multiply(b, a);
                assert.equal(c.eq(d), true, 'Two large, complex multiplications should equal despite order');
                var e = Tpa.multiply(d, '123/2148732556');
                assert.equal(e.toFraction(), '2487554639247395275796018 10842070652485814799145636/22930899589797163016909560', 'Large multiplication of small fraction');
                e.multiply('10000000000000000000000000000000000000');
                assert.equal(e.toFraction(), '24875546392473952757960184728148849995343398553163731375663363 6747688954040168823549720/22930899589797163016909560', 'Very Large multiplication');
                var x = '2', y = '3', z = '6';
                for (var i = 0; i < 1000; i++) {
                    x += '0';
                    y += '0';
                    z += '00';
                }
                assert.equal(Tpa.multiply(x, y).toString(), z, 'Huge multiplication');
                assert.equal(a.multiply(b).toFraction(),'43456013318534256644743932583046 7492827342642432/10671825828564010','Large in-place fractional multiplication');
                a.makeInteger();
                b.makeInteger();
                assert.equal(a.times(b).toString(),'280940056915459726919514677725201367745916287461458','Large in-place integer multiplication');
                assert.equal(Tpa(123).times(10000).times(10000).times(10000).times(10000).times(10000).toString(),'12300000000000000000000','Multiplications of many smaller numbers');
            });
        });

        describe('Division', function() {
            it('Various integers', function() {
                assert.throws(function() {
                    new Tpa(123).divide(0);
                }, Error, 'Divide by zero');
                assert.equal(Tpa(123).divide(1).value(), 123, 'Division by 1 yields the same number');
                assert.equal(Tpa(123).divide(2).value(), 61, 'Division by yeilds a round integer');
                assert.equal(Tpa(10000).divide(100).value(), 100, 'Division by a factor yields an exact answer');
            });

            it('Consistency', function() {
                var n = Tpa(123);
                assert.equal((Tpa.divide(n, 5), n.value()), 123, 'Static divide call should not modify first parameter');
                assert.equal((Tpa.divide(1000, n), n.value()), 123, 'Static divide call should not modify second parameter');
                assert.equal((Tpa.mod(n, 5), n.value()), 123, 'Static mod call should not modify first parameter');
                assert.equal((Tpa.mod(1000, n), n.value()), 123, 'Static mod call should not modify second parameter');
                assert.equal((Tpa(1000).mod(n), n.value()), 123, 'Method mod call should not modify operand');
                assert.equal((Tpa(1000).divide(n), n.value()), 123, 'Method divide call should not modify operand');
                var x = Tpa(1000);
                assert.equal((x.divide(n), x.value()), 8, 'Method divide call should modify the calling number');
                assert.equal((x.mod(4), x.value()), 0, 'Method mod call should modify the calling number');
                x = Tpa(21321432423524234234);
                assert.equal(x.divide(x), 1, 'Divide the same number object');
            });

            it('Various fractions', function() {
                assert.equal(Tpa(3.5).divide(1).value(), 3.5, 'Divide a fraction by 1 to yield the same number');
                assert.equal(Tpa(3.5).divide(2).value(), 1.75, 'Divide a fraction by 2 to yield the an exact half');
                assert.equal(Tpa(3.123).divide(4).value(), 0.78075, 'Divide more complex fraction by a larger number');
                assert.equal(Tpa('3.[6]').divide(2).toString(), '1.8[3]', 'Divide a recurring fraction by 2');
                assert.equal(Tpa('3 123/432').divide(50).toString(), '0.06569[4]', 'Divide a complex fraction by larger number');
                assert.equal(Tpa('2.5').divide(2.5).value(), 1, 'Divide two identical fractions to get 1');
                assert.equal(Tpa(5.5).divide(2.5).value(), 2.2, 'Divide two dissimilar fractions');
                assert.equal(Tpa(5.5).divide(-2.5).value(), -2.2, 'Divide two dissimilar fractions with a negative');
                assert.equal(Tpa(123135.5).divide('-2213213976721367821365812').toFraction(), '-0 1231355/22132139767213678213658120', 'Divide fraction fractions with a large negative number');
                assert.equal(Tpa('123 764/999').divide('5 512/1001').toString(500), '22.[455778417532994295727665312584652805787480429496017678000639755216517949887534806875028009702651718239900222861977438740172109757029097250231924873940462122445084199660962394331979251319472454147096162684344667306421883184616554201473541694676369318384906566889528644105406838776423695763916898591540607128789111750866327629060998645917986139120813762829351011333973088549851283220868140208361343035985051573233556195310772073505443090362430583565258207273795]', 'Divide two complex dissimilar fractions');
                assert.equal(Tpa('123 764/999').divide('5 512/1001').toFraction(), '22 2512015/5511483', 'Fractional form of previous division test');
                assert.equal(Tpa('-20 1/2').toFraction(), '-20 1/2', 'Negative fraction');
            });

            it('Modulus', function() {
                assert.equal(Tpa(5).mod(2).value(), 1, 'Simple modulus');
                assert.equal(Tpa(12542).mod(284).value(), 46, 'Larger modulus');
                assert.equal(Tpa(12542.123).mod(284).value(), 46, 'Larger modulus should ignore fractional part in numerator');
                assert.equal(Tpa(12542.123).mod('284 9/10').value(), 46, 'Larger modulus should ignore fractional part in denominator');
                assert.equal(Tpa.mod(123, 5).value(), 3, 'Static call');
            });
            if (Tpa.getBASE() > 500000) { // Note: Simplification requires a large base to work reliably
                it('Simplification', function() {
                    var n = Tpa('5 3/10');
                    n.simplify();
                    assert.equal(n.toFraction(), '5 3/10', 'No simplification');
                    n.add('2/10');
                    assert.equal(n.simplify(), true, 'Simplification should indicate success');
                    assert.equal(n.toFraction(), '5 1/2', 'Pending simplification');
                    n.multiply('-5.[3]');
                    n.simplify();
                    assert.equal(n.toFraction(), '-29 1/3', 'Pending simplification');
                    n.multiply(-1234583.45);
                    assert.equal(n.toString(), '36214447.8[6]', 'Slightly larger fraction simplification');
                    n.simplify();
                    assert.equal(n.toFraction(), '36214447 13/15', 'Slightly larger fraction simplification');
                    n.divide(1000.125);
                    n.simplify();
                    assert.equal(n.toFraction(), '36209 110609/120015', 'Larger fraction simplification');
                    n.divide(1520.674);
                    //assert.equal(n.simplify(1), false, '1 millisecond will not be enough time to simplify: ' + n.toFraction());
                    if (n.simplify(5000)) assert.equal(n.toFraction(), '23 14814887147/18250369011', 'Larger fraction simplification');
                    else assert.equal(false, '1st Simplification not performed within time constraint');
                    n.multiply(1520.674);
                    if (n.simplify()) assert.equal(n.toFraction(), '36209 110609/120015', 'Larger fraction considerably simplified');
                    else assert.equal(false, '2nd Simplification not performed within time constraint');
                    n.set();
                    assert.equal(n.simplify(),true,'Simplification of integer 0');
                    assert.equal(n.add(123).simplify(),true,'Simplification of positive integer');
                    assert.throws(function() {
                        n.simplify('123');
                    }, Error, 'Bad argument passed to simplify');
                });
            }
        });

        it('Aliases', function() {
            assert.equal(Tpa(1).add(2).value(),3,'add');
            assert.equal(Tpa(1).plus(2).value(),3,'plus');
            assert.equal(Tpa(1).subtract(2).value(),-1,'subtract');
            assert.equal(Tpa(1).sub(2).value(),-1,'sub');
            assert.equal(Tpa(1).minus(2).value(),-1,'minus');
            assert.equal(Tpa(1).multiply(2).value(),2,'multiply');
            assert.equal(Tpa(1).times(2).value(),2,'times');
            assert.equal(Tpa(1).mult(2).value(),2,'mult');
            assert.equal(Tpa(1,false).divide(2).value(),0.5,'divide');
            assert.equal(Tpa(1,false).div(2).value(),0.5,'div');
            assert.equal(Tpa(1).modulus(2).value(),1,'modulus');
            assert.equal(Tpa(1).mod(2).value(),1,'mod');
        });

        it('Various, complex chained combinations', function() {
            var i;
            var n = Tpa('123.5');
            n.multiply(5.5).add(1001).multiply('500.123').subtract('4041244 25/89').divide('666 100/77');
            n.multiply('666 100/77').add('4041244 25/89').divide('500.123').subtract(1001).divide(5.5);
            assert.equal(n.toDecimal(), '123.5', 'Build up and build down');
            n.divide('2835325284393 64280/865273').add('232123 44/20').multiply('3274729926465837464735647659').subtract('232456788978962374523').divide('2134234 7/8');
            n.multiply('2134234 7/8').add('232456788978962374523').divide('3274729926465837464735647659').subtract('232123 44/20').multiply('2835325284393 64280/865273');
            assert.equal(n.toDecimal(), '123.5', 'More complex build up and build down');
            n = Tpa('123.5');
            var x = new Tpa(n);
            for (i = 0; i < 20; i++) {
                x.multiply(n);
            }
            assert.equal(x.toDecimal(), '84140697819361566263630764279294864662329687.298320293426513671875', 'Power up');
            for (i = 0; i < 20; i++) {
                x.divide(n);
            }
            assert.equal(n.toDecimal(), '123.5', 'Power down');
            assert.equal(n.toFraction(), '123 5/10', 'Power down fractional');
            n.subtract('123 1/2');
            assert.equal(n.isZero(), true, 'Power down to zero');
            assert.equal(Tpa().simplify(),true,'Simplification of zero');
        });

    });
}
