/**
 * @file The complete code for Total Precision Arithmetic
 * @author Dominic Thwaites
 * @copyright (c) 2016 Dominic Thwaites dominicthwaites@mac.com
 * @licence MIT
 */

module.exports = (/** @lends DJT*/function(globalObj) { //eslint-disable-line
    'use strict';

    /** @const */
    var INPUT_ERROR_MESSAGE='Number initialisation parameter badly formed';
    /** @const */
    var VALUE_DECIMAL_PLACES=8;                // # DPs to take from a numeric construction and to output with the value() method

    // Polyfill Math.trunc
    Math.trunc = Math.trunc || function(x) {
        return x < 0 ? Math.ceil(x) : Math.floor(x);
    };

    // Polyfill Math.sign
    Math.sign = Math.sign || function(x) {
        x = +x; // convert to a number
        if (x === 0 || isNaN(x)) {
            return x;
        }
        return x > 0 ? 1 : -1;
    };

    /**
     * Tpa stores and manipulates rational numbers with total precision
     *
     * @param {number|string|Tpa} [initialValue] Initial value to set this number.
     * 1. Numeric values are only represented to a precision of 8 decimal places and, in any case, are limited by the precision of a JS floating point number. To initialse a number with definite accuracy the string form is recommended.
     * 2. String values can be represented in decimal or fractional form.
     *   * Decimal form: `<+/->iii.ddd[rrr]` where `+/-` is optional, `iii` represents the integer part and `ddd` the decimal part with `[rrr]` representing an optional recurring decimal part
     *   * Fractional form: `<+/-> iii nnn/ddd` where `+/-` is optional, `iii` represents the (optional) integer part, `nnn` the numerator and `ddd` the denominator. The fraction may be top heavy.
     * 3. Tpa instance causes this constructor to return a copy of it.
     *
     * Tpa may be called statically, in which case a new instance is still returned.
     * __Note well:__ If initialValue is itself a Tpa, then the same Tpa is returned *without* making a copy when called statically.
     * @param {boolean} [isInteger=true] Set to `false` to enable this number to represent fractions.
     * If the initialValue is fractional in any way then isInteger will default to `false`.
     * The initial setting of this number (integer or fractional) is always kept throughout its life unless the Tpa~makeFraction or Tpa~makeInteger methods are called to change it.
     *
     * @example
     * var a=new Tpa();                 // Creates a new number set to zero
     * var b=Tpa(20);                   // Creates a new number preset to 20
     * var c=Tpa['0.[6]'];              // Creates a new number preset to 2/3
     * var d=new Tpa('2/3'];            // Creates a new number preset to 2/3
     * var e=new Tpa('-4 538/1284');    // Creates a new number preset to -4.4[19003115264797507788161993769470404984423676012461059]
     * var f=new Tpa(b);                // Creates a new number preset to 20
     * var g=Tpa(e);                    // Does NOT create a new number: Object g references Object f
     * var h=Tpa(false);                // Creates a new number set to zero but is configured to represent fractions
     * var i=Tpa(100,false);            // Creates a new number set to 100 but is configured to represent fractions
     * var j=Tpa(100.5,true);           // Creates a new number set to 100 as we explicitly set it to be integer only and the fractional part is ignored
     * var k=Tpa('10 20/3',true);       // Creates a new number set to 16 as we explicitly set it to be integer only and the fractional part is ignored
     * @constructor
     */
    var Tpa=TPA;

    var N=require('./N.js');

    // Utility function to return a remainder in standard form
    function standardRemainder(numerator,denominator) {
        return {
            numerator: numerator instanceof N ? numerator : new N(),
            denominator: denominator instanceof N ? denominator : new N(1)
        };
    }

    // Constructor for a new Tpa
    function TPA(initial,integer) {
        // Logic to redirect a static call to return a new object
        if (!(this instanceof Tpa)) {
            // The only exception to the above is that if an instance of this class is passed in the static
            // call it will be returned with creating a new copy - so long as the type is the same (integer or not)
            if (initial instanceof Tpa && (typeof integer != 'boolean' || integer == initial.integer)) return initial;
            switch (arguments.length) {
            case 0:
                return new Tpa();
            case 1:
                return new Tpa(initial);
            default:
                return new Tpa(initial, integer);
            }
        }
        return this.set.apply(this,arguments);
    }

    /**
     * Sets this number to a new value
     *
     * Parameters passed are exactly those expected for construction of a new Tpa
     *
     * @param {number|string|DJT~Tpa} [initialValue] Initial value to set this number.
     * @param {boolean} [isInteger=true] Set to `false` to enable this number to represent fractions.
     * @return {Tpa} this number for chaining purposes
     */
    Tpa.prototype.set=function(initialValue,isInteger) {
        var me = this;
        // Establish whether this instance is to be an integer only
        this.integer=true;
        if (typeof initialValue == 'boolean') this.integer=initialValue;
        if (typeof isInteger=='boolean') this.integer=isInteger;

        // If the constructor argument is an instance of this class then we return a copy of that instance
        if (initialValue instanceof Tpa) {
            this.number=new N(initialValue.number);
            if (!(typeof isInteger == 'boolean') && initialValue.isFractional()) this.integer=false;
            if (!this.integer) {
                if (initialValue.isInteger()) this.remainder=standardRemainder();
                else {
                    this.remainder = {
                        numerator: new N(initialValue.remainder.numerator),
                        denominator: new N(initialValue.remainder.denominator)
                    };
                }
            }
            return this;
        }

        // If the constructor argument is a number then we preset this number with the number given
        if (typeof initialValue == 'number') {
            this.number=new N(initialValue);
            var denominator=Math.pow(10,VALUE_DECIMAL_PLACES);
            var numerator=Math.trunc((initialValue-Math.trunc(initialValue)).toFixed(VALUE_DECIMAL_PLACES)*denominator);

            // Note that the fractional part only takes 8 decimal places (as per VALUE_DECIMAL_PLACES)
            if (typeof isInteger!='boolean' || !this.integer) {
                if (typeof isInteger!='boolean') this.integer=numerator==0;
                while (numerator != 0 && numerator % 10 == 0) {
                    numerator/=10;
                    denominator/=10;
                }
                if (numerator>0 || !this.integer) {
                    this.integer=false;
                    this.remainder = {
                        numerator: new N(numerator),
                        denominator: new N(denominator)
                    };
                }
            }
            return this;
        }

        // Helper function to parse and create a fraction from an arbitrary number of decimal input representation
        // Note that the input is assumed to be "clean"
        function parseDecimal(input,sign) {
            me.remainder=standardRemainder();
            for (var i= 0,recurring=null; i<input.length; i++) {
                if (input[i]=='[' && recurring===null) {
                    recurring = {
                        numerator: new N(me.remainder.numerator),
                        denominator: new N(me.remainder.denominator)
                    };
                    continue;
                }
                // The recurring section is mathematically achieved by subtracting the the values at the start
                if (recurring && input[i]==']') {
                    me.remainder.numerator.subtract(recurring.numerator);
                    me.remainder.denominator.subtract(recurring.denominator);
                    return this;
                }
                me.remainder.denominator._digitMultiplyWithAdd(10, 0);
                me.remainder.numerator._digitMultiplyWithAdd(10, sign*parseInt(input[i]));
            }
            if (recurring) throw new Error(INPUT_ERROR_MESSAGE);
        }

        // Helper function to parse and create a fraction from a fractional input representation
        // Note that the input is assumed to be "clean" and that the regexps below will match
        function parseFraction(input) {
            var remainder=standardRemainder(new N(input.match(/^[\+\-]?\d+/)[0]),new N(input.match(/\/(\d+)$/)[1]));
            if (remainder.denominator.isZero()) throw new Error(INPUT_ERROR_MESSAGE);
            if (!me.integer) {
                me.remainder=remainder;
                me._normaliseRemainder();
            }
            else me.number.add(remainder.numerator.quotient(remainder.denominator));
        }

        if (typeof initialValue == 'string') {
            initialValue=initialValue.trim();
            if (!this.integer) this.remainder=standardRemainder();
            if (initialValue.match(/^[\+\-]?\d+\/\d+$/)) {                               // [+/-]nnn/nnn
                if (typeof isInteger != 'boolean') this.integer = false;
                this.number=new N();
                parseFraction(initialValue);
            } else {
                var sign=initialValue[0]=='-';
                if (initialValue.match(/^[\+\-]?\d*/)===null) throw new Error(INPUT_ERROR_MESSAGE);
                this.number=new N(initialValue.match(/^[\+\-]?\d*/)[0]);                 // [+/-]nnn
                if (initialValue.match(/^[\+\-]?\d*$/)) return this;
                var match=initialValue.match(/^[\+\-]?\d*([\. ])/);
                if (match===null) throw new Error(INPUT_ERROR_MESSAGE);
                var remaining=initialValue.match(/^[\+\-]?\d*[\. ](.*)/)[1];             // [+/-]nnn[./ ]
                if (typeof isInteger != 'boolean') this.integer = false;
                switch (match[1]) {
                case '.':
                    // Parse dor decimal representation
                    if (remaining.match(/^\d*\[?\d+\]?$/)===null) throw new Error(INPUT_ERROR_MESSAGE);
                    if (!this.integer) parseDecimal(remaining,sign ? -1 : 1);
                    break;

                case ' ':
                    // Parse for fractional representation
                    if (remaining.match(/^\d+\/\d+$/)===null) throw new Error(INPUT_ERROR_MESSAGE);
                    parseFraction((sign ? '-' : '')+remaining);
                    break;
                }
            }
            return this;
        }

        if (typeof initialValue=='undefined' && arguments.length>0) throw new Error(INPUT_ERROR_MESSAGE);
        // If we had no initialiser, then set this number to zero
        this.number=new N();
        if (!this.integer) this.remainder = standardRemainder();
        return this;
    };

    /**
     * Attempts a simplification of the remaining fraction
     *
     * Finding common factors (which would be prime numbers) is a time-consuming job.
     * Just as well, as otherwise most security mechanism (i.e. RSA) could be hacked in a jiffy.
     * So there is a limit to how large a fraction can be simplified. A realistic limit has therefore been
     * established here whereby prime factors can not exceed the BASE of the internal number representation.
     * Thus the highest prime explored is **33,554,393**.
     * Fractions that have their numerator larger than the square of this number may not be completely simplified - i.e. numbers of more than 15 digits.
     *
     * @param {number} [milliseconds=100] The maximum time in milliseconds to attempt simplification. 0 sets no limit.
     * @returns {boolean} `true` if simplification complete, `false` if there may still be some common factors left
     * @throws {Error} If an invalid limit is given
     */
    Tpa.prototype.simplify=function(milliseconds) {
        // Preparations
        if (arguments.length>0 && (typeof milliseconds!='number' || isNaN(milliseconds)))
            throw new Error('Simplify() takes an optional numeric argument specifying the maximum number of millisecondsto process');
        if (typeof milliseconds=='undefined') milliseconds=100;
        if (this.isInteger() || this.remainder.numerator.isZero()) return true;
        var limit= N.abs(this.remainder.numerator)._roughSqrt().value();
        var primes=new N.Primes();
        var start=new Date().getTime();
        var factor=new N().set(1);

        // Loop through all the primes up to the square root of the numerator to test for common factors
        for (var prime= primes.next(); prime>0 && prime<=limit; prime= primes.next()) {
            while (this.remainder.numerator.isDivisibleBy(prime)) {
                this.remainder.numerator.digitDivide(prime);
                if (this.remainder.denominator.isDivisibleBy(prime)) this.remainder.denominator.digitDivide(prime);
                else factor.digitMultiply(prime);
            }
            // Abort if our time is up
            if (new Date().getTime()-start>milliseconds && milliseconds>0) {
                prime=0;
                break;
            }
        }

        // Clean up and set the factorised remainder accordingly
        var denominator=new N(this.remainder.denominator);
        var remainder=denominator.divide(this.remainder.numerator);
        if (remainder.isZero()) {
            this.remainder.denominator=denominator;
            this.remainder.numerator=factor;
            return true;
        } else this.remainder.numerator.multiply(factor);

        // If prime is zero then we never got to finish
        return prime>0;
    };

    /**
     * Sets this number to hold integers only - removes any existing fractional part
     *
     * @returns {Tpa} This number for chaining purposes
     */
    Tpa.prototype.makeInteger=function() {
        this.integer=true;
        delete this.remainder;
        return this;
    };

    /**
     * Sets this number to accept fractional amounts, if not already set
     *
     * @returns {Tpa} This number for chaining purposes
     */
    Tpa.prototype.makeFractional=function() {
        if (this.integer) {
            this.integer = false;
            this.remainder = standardRemainder();
        }
        return this;
    };

    /**
     * @returns {boolean} `true` if this number only represents integers
     */
    Tpa.prototype.isInteger=function() {
        return this.integer;
    };

    /**
     * @returns {boolean} `true` if this number is capable of representing fractions
     */
    Tpa.prototype.isFractional=function() {
        return !this.integer;
    };

    /**
     * @returns {boolean} `true` if this number is less than zero
     */
    Tpa.prototype.isNegative=function() {
        if (this.isZero()) return false;
        if (this.number.isZero()) return this.remainder.numerator.isNegative();
        else return this.number.isNegative();
    };

    /**
     * @returns {boolean} `true` if this number is greater than zero
     */
    Tpa.prototype.isPositive=function() {
        if (this.isZero()) return false;
        if (this.number.isZero()) return this.remainder.numerator.isPositive();
        else return this.number.isPositive();
    };

    /**
     * @returns {boolean} `true` if this number is equal than zero
     */
    Tpa.prototype.isZero=function() {
        this._normaliseRemainder();
        return this.number.isZero() && (this.isInteger() || this.remainder.numerator.isZero());
    };

    /**
     * @returns {number} `-1` if this number is negative, `0` if zero or `1` if positive
     */
    Tpa.prototype.sign=function() {
        if (this.isZero()) return 0;
        return this.isNegative() ? -1 : 1;
    };

    /**
     * @returns {boolean} `true` if this number has a non-zero fractional part
     */
    Tpa.prototype.hasFraction=function() {
        if (this.integer) return false;
        this._normaliseRemainder();
        return !this.remainder.numerator.isZero();
    };

    /**
     * Gets the value of this number a standard JS floating point number
     *
     * Note that precision may well be lost in order to accommodate the limitations of floating point numbers.
     * For this reason, the number of decimal places is restricted to 8.
     * Tpa numbers can be so large as to cause an overflow on a floating point number to yield `infinity`
     *
     * @returns {number} A numeric value of this number
     */
    Tpa.prototype.value=function() {
        var power=Math.pow(10,VALUE_DECIMAL_PLACES);
        if (this.integer) return this.number.value();
        else {
            var numerator = new N(this.remainder.numerator).multiply(new N(power));
            numerator.divide(this.remainder.denominator);
            return (this.number.value() + (numerator.value() / power).toFixed(VALUE_DECIMAL_PLACES)*1);
        }
    };

    /**
     * Sets a number to hold fractional value
     *
     * @param {Tpa|number|string} number The number to set
     */
    Tpa.makeFractional=function(number) {
        return new Tpa(number).makeFractional();
    };

    /**
     * Sets a number to hold integer values only
     *
     * @param {Tpa|number|string} number The number to set
     */
    Tpa.makeInteger=function(number) {
        return new Tpa(number).makeInteger();
    };

    /**
     * Sets the integer part of a number to zero
     *
     * @param {Tpa|number|string} number The number from which the integer part is to be removed
     */
    Tpa.frac=function(number) {
        return new Tpa(number).frac();
    };

    /**
     * Sets the fractional part of a number to zero
     *
     * @param {Tpa|number|string} number The number from which the fractional part is to be removed
     */
    Tpa.int=function(number) {
        return new Tpa(number).int();
    };

    /**
     * Adds two numbers
     *
     * @param {Tpa|number|string} a First number
     * @param {Tpa|number|string} b Second number
     * @returns {Tpa} a + b
     */
    Tpa.add=function(a,b) {
        return new Tpa(a).add(b);
    };

    /**
     * Subtracts two numbers
     *
     * @param {Tpa|number|string} a First number
     * @param {Tpa|number|string} b Second number
     * @returns {Tpa} a - b
     */
    Tpa.subtract=function(a,b) {
        return new Tpa(a).subtract(b);
    };

    /**
     * Multiplies two numbers
     *
     * @param {Tpa|number|string} a First number
     * @param {Tpa|number|string} b Second number
     * @returns {Tpa} a * b
     */
    Tpa.multiply=function(a,b) {
        return new Tpa(a).multiply(b);
    };

    /**
     * Divides two numbers
     *
     * @param {Tpa|number|string} a First number
     * @param {Tpa|number|string} b Second number
     * @returns {Tpa} a / b
     */
    Tpa.divide=function(a,b) {
        return new Tpa(a).divide(b);
    };

    /**
     * Modulus of two numbers
     *
     * @param {Tpa|number|string} a First number
     * @param {Tpa|number|string} b Second number
     * @returns {Tpa} a mod b
     */
    Tpa.modulus=function(a,b) {
        return new Tpa(a).mod(b);
    };

    /**
     * Absolute value of a number
     *
     * @param {Tpa|number|string} n The number
     * @returns {Tpa} |n|
     */
    Tpa.abs=function(n) {
        return new Tpa(n).abs();
    };

    /**
     * Creates a random number of an approximate number of decimal digits long
     *
     * @param {number} digits The number of decimal digits
     * @returns {Tpa} A new number set a a random value
     */
    Tpa.random=function(digits) {
        if (typeof digits=='number' && digits>0) {
            var result=new Tpa();
            result.number.random(digits);
        } else throw new Error('You must specify a positive number of decimal digits as an approximate size for this number');
        return result;
    };

    /**
     * Compares the given number with this number
     *
     * @param {Tpa|number|string} number The number to compare
     * @returns {number} `-1` if this number is less than the given number, `0` if equal, `1` if greater
     */
    Tpa.prototype.compare=function(number) {
        function compare(a,b) {
            return N.abs(a).normalise().positivise().compare(N.abs(b).positivise().normalise());
        }

        if (number===this) return 0;
        number = Tpa(number);
        this._normaliseRemainder();
        number._normaliseRemainder();
        if (this.sign()!=number.sign()) {
            if (this.sign()==0) return -number.sign();
            else return this.sign();
        }
        var result = compare(this.number,number.number);
        if (result == 0 && this.isFractional()) {
            if (number.isFractional()) result=compare(new N(this.remainder.numerator).multiply(number.remainder.denominator),new N(this.remainder.denominator).multiply(number.remainder.numerator));
        }
        return result;
    };

    /**
     * @param {Tpa|number|string} number The number to compare
     * @returns {boolean} `true` if this number is less than the given number
     */
    Tpa.prototype.lt=function(number) {
        return this.compare(number)==-1;
    };

    /**
     * @param {Tpa|number|string} number The number to compare
     * @returns {boolean} `true` if this number is less than or equal to the given number
     */
    Tpa.prototype.lte=function(number) {
        return this.compare(number)!=1;
    };

    /**
     * @param {Tpa|number|string} number The number to compare
     * @returns {boolean} `true` if this number is greater than the given number
     */
    Tpa.prototype.gt=function(number) {
        return this.compare(number)==1;
    };

    /**
     * @param {Tpa|number|string} number The number to compare
     * @returns {boolean} `true` if this number is greater than or equal to the given number
     */
    Tpa.prototype.gte=function(number) {
        return this.compare(number)!=-1;
    };

    /**
     * @param {Tpa|number|string} number The number to compare
     * @returns {boolean} `true` if this number is equal to the given number
     */
    Tpa.prototype.eq=function(number) {
        return this.compare(number)==0;
    };

    /**
     * Sets the fractional part of this number to zero
     *
     * @return {Tpa|number|string} This number for chaining purposes
     */
    Tpa.prototype.int=function() {
        if (!this.integer) this.remainder=standardRemainder();
        return this;
    };

    /**
     * Sets the integer part of this number to zero
     *
     * @return {Tpa|number|string} This number for chaining purposes
     */
    Tpa.prototype.frac=function() {
        this._normaliseRemainder().number.reset();
        return this;
    };

    /**
     * Takes the absolute value of this number
     *
     * @return {Tpa|number|string} This number for chaining purposes
     */
    Tpa.prototype.abs=function() {
        this.number.abs();
        if (!this.integer) this.remainder.numerator.abs();
        return this;
    };

    /**
     * Multiply this number by the one given
     *
     * If this number is fractional, then it will perform a full fractional multiplication.
     * If it is set as an integer then the multiplication will ignore any fractional part of the multiplier
     *
     * @param {Tpa|number|string} number The number to multiply by
     * @returns {Tpa} This number for chaining purposes
     */
    Tpa.prototype.multiply=function(number) {
        if (!(number instanceof TPA)) number=Tpa(number);
        if (!this.integer) {
            if (!number.integer) {
                this.remainder.numerator.multiply(N.temporary(number.remainder.denominator).multiply(number.number).add(number.remainder.numerator))
                                        .add(N.temporary(number.remainder.numerator).multiply(this.number).multiply(this.remainder.denominator));
                this.remainder.denominator.multiply(number.remainder.denominator);
            } else this.remainder.numerator.multiply(number.number);
        }
        this.number.multiply(number.number);
        return this;
    };

    /**
     * Divide this number by the one given
     *
     * If this number is fractional, then it will perform a full fractional division.
     * If it is set as an integer then the division will ignore any fractional part of the divisor
     *
     * @param {Tpa|number|string} number The number to multiply by
     * @returns {Tpa} This number for chaining purposes
     */
    Tpa.prototype.divide=function(number) {
        if (!(number instanceof TPA)) number=Tpa(number);
        if (!this.integer) {
            if (!number.integer) {
                this.number.multiply(this.remainder.denominator).add(this.remainder.numerator).multiply(number.remainder.denominator);
                this.remainder.numerator =this.number.divide(this.remainder.denominator.multiply(N.temporary(number.number).multiply(number.remainder.denominator).add(number.remainder.numerator)));
            } else {
                this.number.multiply(this.remainder.denominator).add(this.remainder.numerator);
                this.remainder.numerator = this.number.divide(this.remainder.denominator.multiply(number.number));
            }
        } else this.number.divide(number.number);
        return this;
    };

    /**
     * Sets this number to the modulus of the number given
     *
     * Fractional parts of either number are ignored - the modulus is based on the integer parts ony
     *
     * @param {Tpa|number|string} number The divisor number
     * @returns {Tpa} This number for chaining purposes
     */
    Tpa.prototype.modulus=function(number) {
        if (!(number instanceof TPA)) number=Tpa(number);
        this.number=this.number.divide(number.number);
        if (!this.integer) this.remainder=standardRemainder();
        return this;
    };

    /**
     * Subtracts the given number from this number
     *
     * If this number is fractional, then it will perform a full fractional subtraction.
     * If it is set as an integer then the subtraction will ignore any fractional part of the number to be subtracted
     *
     * @param {Tpa|number|string} number The number to subtract
     * @returns {Tpa} This number for chaining purposes
     */
    Tpa.prototype.subtract=function(number) {
        if (!(number instanceof TPA)) number=Tpa(number);
        this.number.subtract(number.number);
        if (!this.integer) {
            if (!number.integer && !number.remainder.numerator.isZero()) {
                this.remainder.numerator.multiply(number.remainder.denominator);
                this.remainder.numerator.subtract(N.temporary(number.remainder.numerator).multiply(this.remainder.denominator));
                this.remainder.denominator.multiply(number.remainder.denominator);
            }
            this._normaliseRemainder();
        }
        return this;
    };

    /**
     * Adds the given number to this number
     *
     * If this number is fractional, then it will perform a full fractional addition.
     * If it is set as an integer then the addition will ignore any fractional part of the number to be added
     *
     * @param {Tpa|number|string} number The number to add
     * @returns {Tpa} This number for chaining purposes
     */
    Tpa.prototype.add=function(number) {
        if (!(number instanceof TPA)) number=Tpa(number);
        this.number.add(number.number);
        if (!this.integer) {
            if (!number.integer && !number.remainder.numerator.isZero()) {
                this.remainder.numerator.multiply(number.remainder.denominator);
                this.remainder.numerator.add(N.temporary(number.remainder.numerator).multiply(this.remainder.denominator));
                this.remainder.denominator.multiply(number.remainder.denominator);
            }
            this._normaliseRemainder();
        }
        return this;
    };

    /**
     * Outputs a decimal representation of this number
     *
     * All Tpa numbers are rational and thus have a limited or recurring set of decimal places.
     * Recurring decimals are notated in square brackets - e.g. 33.[3] for 33 and one third
     *
     * @param {number} [maxDecimalPlaces=100] The maximum number of decimal places to give
     * @returns {string} The number in format: `[-]nnn.ddd[rrr]`
     */
    Tpa.prototype.toDecimal=function(maxDecimalPlaces) {
        return typeof maxDecimalPlaces=='undefined' ? this.toString() : this.toString(maxDecimalPlaces);
    };

    /**
     * Outputs the decimal representation of the integer part of this number only
     *
     * @returns {string} The number in decimal form: `[-]nnn`
     */
    Tpa.prototype.toInteger=function() {
        this._normaliseRemainder();
        return (this.isNegative() ? '-' : '')+N.abs(this.number).toString();
    };

    /**
     * Outputs this number in fractional representation: `[-]nnn nnn/nnn`
     *
     * @returns {string} The number in fractional form
     */
    Tpa.prototype.toFraction=function() {
        var result=this.toInteger();
        if (this.isFractional() && !this.remainder.numerator.isZero()) {
            result=result+' '+ N.abs(this.remainder.numerator).toString();
            result=result+'/'+this.remainder.denominator.toString();
        }
        return result;
    };

    Tpa.prototype.toString=function(maxdp) {
        if (typeof maxdp != 'number' || isNaN(maxdp)) {
            if (arguments.length>0) throw new Error('toString() takes an optional parameter to specify the maximum DPs to output [default=100]');
            else maxdp=100;
        }

        var result=this.toInteger();
        if (this.isFractional() && !this.remainder.numerator.isZero()) {
            result+='.';
            var numeratorstore=[];
            for (var numerator=new N(this.remainder.numerator).abs().normalise().positivise(),remainder=0; !numerator.isZero() && maxdp>0; maxdp--) {
                for (var i=numeratorstore.length-1; i>=0; i--) {
                    if (numeratorstore[i].compare(numerator)==0) break;
                }
                if (i>=0) {
                    result=result.substr(0,result.length+i-numeratorstore.length)+'['+result.substr(result.length+i-numeratorstore.length)+']';
                    break;
                }
                numeratorstore.push(new N(numerator));
                remainder = numerator._digitMultiplyWithAdd(10, 0).divide(this.remainder.denominator);
                result+=numerator.lsb();
                numerator=remainder;
            }
            if (maxdp==0 && !numerator.isZero()) result=result+'...';
        }
        return result;
    };

    /**
     * Normalises the remainder - ensures the numerator is less than the denominator
     *
     * @private
     * @returns {Tpa} This number for chaining purposes
     */
    Tpa.prototype._normaliseRemainder=function() {
        if (!this.integer) {
            var numerator = this.remainder.numerator.divide(this.remainder.denominator);
            this.number.add(this.remainder.numerator);
            this.remainder.numerator = numerator;
            if (this.remainder.numerator.isZero()) this.remainder.denominator.set(1);
            else {
                if (this.remainder.numerator.isNegative()) {
                    if (this.number.isPositive()) {
                        this.remainder.numerator.add(this.remainder.denominator);
                        this.number.subtract(N.ONE);
                    }
                } else {
                    if (this.number.isNegative()) {
                        this.remainder.numerator.subtract(this.remainder.denominator);
                        this.number.add(N.ONE);
                    }
                }
            }
        }
        return this;
    };

    // Allow external access to the internal N class - for testing purposes only
    if (typeof PRODUCTION==='undefined') {
        Tpa.N = N;
    }

    // Aliases
    Tpa.plus=Tpa.add;
    Tpa.prototype.plus=Tpa.prototype.add;
    Tpa.minus=Tpa.subtract;
    Tpa.prototype.minus=Tpa.prototype.subtract;
    Tpa.sub=Tpa.subtract;
    Tpa.prototype.sub=Tpa.prototype.subtract;
    Tpa.times=Tpa.multiply;
    Tpa.prototype.times=Tpa.prototype.multiply;
    Tpa.mult=Tpa.multiply;
    Tpa.prototype.mult=Tpa.prototype.multiply;
    Tpa.div=Tpa.divide;
    Tpa.prototype.div=Tpa.prototype.divide;
    Tpa.mod=Tpa.modulus;
    Tpa.prototype.mod=Tpa.prototype.modulus;

    return Tpa;
})();
