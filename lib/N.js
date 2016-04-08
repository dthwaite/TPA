/**
 * @file An internal module to store large integers for Total Precision Arithmetic
 * @author Dominic Thwaites
 * @copyright (c) 2016 Dominic Thwaites dominicthwaites@mac.com
 * @licence MIT
 * @module N
 */

module.exports=(/** @lends module:N*/function() {
    'use strict';

    /**
     * The built in error object.
     * @external Error
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error}
     */

    // These are effectively constants - but they are changed for testing purposes
    var BASE=Math.pow(2,25);                   // The BASE to which numbers are stored
    var ROOTBASE=Math.floor(Math.sqrt(BASE));  // The square root of BASE
    var SQUAREBASE=Math.pow(BASE,2);           // The square of the BASE - i.e. the maximum number able to be expressed accurately within a digit

    /**
     * The error message given when passing an invlaid initial value for a new number
     *
     * @const
     */
    var INPUT_ERROR_MESSAGE='Number initialisation parameter badly formed';

    /**
     * N is the core vehicle to store and manipulate arbitrarily long integers
     *
     * This class is not intended for external use and is *only* used internally by the TPA class. It does not form any part of the TPA API. It is documented here for developer convenience and interest. The minified browser build gives no access to this class except except via the internals of Tpa objects
     *
     * For efficiency reasons many methods do not have error checking or may make assumptions about the state of the number.
     * Any assumptions, however, are documented.
     *
     * @param {(Number|String|module:N~N)} [initialValue] The initial value assigned to this number.
     * This may be a JS numeric value, a string or another N instance. If numeric, any fractional part is ignored.
     * If string it may only contain digits starting with an optional + or - sign. If N, the new N will be a duplicate.
     * @constructor
     * @throws {external:Error} If parameter passed is not one of the above or is badly formed.
     */
    var N=function(initialValue) {
        var i;
        if (this instanceof N) {
            if (arguments.length==0) {
                this.digits=[];
                this.safemaximum=0;
            } else {
                if (initialValue instanceof N) {
                    this.digits = new Array(initialValue.digits.length);
                    for (i = this.digits.length - 1; i >= 0; i--) this.digits[i] = initialValue.digits[i];
                    this.safemaximum = initialValue.safemaximum;
                } else {
                    if (typeof initialValue == 'number') {
                        if (isNaN(initialValue)) throw new Error(INPUT_ERROR_MESSAGE);
                        else this.set(Math.trunc(initialValue));
                    } else {
                        if (typeof initialValue == 'string') {
                            var sign = initialValue[0] == '-' ? -1 : 1;
                            this.digits=[];
                            this.safemaximum=0;
                            for (i = (initialValue[0] == '-' || initialValue[0] == '+' ? 1 : 0); i < initialValue.length && /^\d$/.test(initialValue[i]); i++) {
                                this._digitMultiplyWithAdd(10, sign * parseInt(initialValue[i]));
                            }
                            if (i != initialValue.length) throw new Error(INPUT_ERROR_MESSAGE);
                        } else throw new Error(INPUT_ERROR_MESSAGE);
                    }
                }
            }
        } else {
            if (typeof initialValue=='undefined') return new N();
            else return new N(initialValue);
        }
    };

    // The build process will remove these methods
    if (typeof PRODUCTION==='undefined') {
        /**
         * Sets the BASE to which numbers are internally represented.
         *
         * This should *only* be set for experimentation and testing purposes.
         * Any existing instances of Tpa will become corrupt or invalid once the base is changed.
         * In the browser version this method is not available.
         * Safe rule: Don't call this set method!
         *
         * @param {Number} base The new BASE for number internal representation
         */
        N.setBASE = function(base) {
            BASE = base;
            ROOTBASE = Math.floor(Math.sqrt(BASE));
            SQUAREBASE = Math.pow(BASE, 2);
        };

        /**
         * The BASE to which all numbers are stored.
         *
         * This is preset to 2^25 which is the optimal size.
         * However, it may be lower (not higher!) in order to test the integrity of internal representation and manipulation of numbers.
         * In the browser version this method is not available.
         *
         * @returns {Number}
         */
        N.getBASE = function() {
            return BASE;
        };
    }

    /**
     * Ensures that all digits of this number are less than the BASE
     *
     * Internal representation allows for digits to exceed BASE. Normalisation
     * is necessary where an impending operation depends on this not being the case.
     * Note also that normalisation does *not* remove negative digits that are
     * also permitted. Again, for some operations, negative digits are undesired
     * and the positivise method is required to remove them.
     *
     * @see #positivise
     * @param {Boolean} [noReduction=false] set to true if we wish to keep any trailing zero digits
     * @returns {module:N~N} This number for chaining purposes
     */
    N.prototype.normalise=function(noReduction) {
        if (this.safemaximum>=BASE) {
            for (var i = 0, carry = 0; i < this.digits.length; i++) {
                carry += this.digits[i];
                this.digits[i] = carry % BASE;
                carry = Math.trunc(carry / BASE);
            }
            if (carry) this.digits[this.digits.length] = carry;
            this.safemaximum = BASE-1;
        }
        if (noReduction) return this;
        while (this.digits.length>0 && this.digits[this.digits.length-1]==0) this.digits.length--;
        return this;
    };

    /**
     * Removes any negative digits by carry over.
     *
     * This function should *only* be called once it is established that the number is both positive overall
     * and is normalised.
     * @see #abs
     * @see #normalise
     */
    N.prototype.positivise=function() {
        for (var i=0; i<this.digits.length; i++) {
            if (this.digits[i]<0) {
                this.digits[i]+=BASE;
                this.digits[i+1]--;
            }
        }
        while (this.digits.length>0 && this.digits[this.digits.length-1]==0) this.digits.length--;
        return this;
    };

    /**
     * @returns {Boolean} `true` if this number is negative, false if zero or positive
     */
    N.prototype.isNegative=function() {
        if (this.isZero()) return false;
        return this.digits[this.digits.length-1]<0;
    };

    /**
     * @returns {Boolean} `true` if this number is zero
     */
    N.prototype.isZero=function() {
        return this.normalise().digits.length==0;
    };

    /**
     * @returns {Boolean} `true` if this number is positive, false if zero or negative
     */
    N.prototype.isPositive=function() {
        if (this.isZero()) return false;
        return this.digits[this.digits.length-1]>0;
    };

    /**
     * @returns {Number} The least significant digit of the number or 0 if zero
     */
    N.prototype.lsb=function() {
        return this.isZero() ? 0 : (BASE+this.digits[0])%BASE;
    };

    /**
     * Resets number to zero
     *
     * @returns {module:N~N} This number for chaining purposes
     */
    N.prototype.reset=function() {
        this.digits=[];
        this.safemaximum=0;
        return this;
    };

    /**
     * Checks for divisibility.
     *
     * The divisor *must* be positive and less than the BASE
     *
     * @param {Number} testDivisor The number to test as a factor of this number
     * @return {Boolean} `true` if this number is divisible by the test-divisor
     */
    N.prototype.isDivisibleBy=function(testDivisor) {
        if (testDivisor<BASE) {
            for (var i = this.digits.length - 1, temp = 0; i >= 0; i--) temp = (temp % testDivisor) * BASE + this.digits[i];
            return temp % testDivisor == 0;
        }
    };

    /**
     * Sets a new numeric value into this number
     *
     * @param {Number} newValue As per instantiation, setting Tpa with a JS native number is subject to accuracy constraints
     * @return {module:N~N} This number for chaining purposes
     */
    N.prototype.set=function(newValue) {
        this.digits=[];
        this.safemaximum=0;
        for (var i=0; newValue!=0; i++) {
            this.digits[i]=newValue%BASE;
            newValue=Math.trunc(newValue/BASE);
        }
        this.safemaximum=BASE-1;
        return this;
    };

    /**
     * Gets the numeric value of this number
     *
     * The JS native number returned is subject to accuracy constraints and thus this method is only useful
     * as an indicator. Indeed, for very large numbers `infinity` can be returned.
     *
     * @return {Number} The value of this number accurate to within the bounds of JS native floating point number
     */
    N.prototype.value=function() {
        for (var i=this.digits.length- 1, result=0; i>=0; i--) result+=(this.digits[i]*Math.pow(BASE,i));
        return result;
    };

    /**
     * Compares two numbers
     *
     * *Note* This function can only be called when both numbers are positivised (and hence normalised)
     *
     * @see #positivise
     * @param {module:N~N}  comparison The number to compare with this number
     * @return {number} 0 if equal, -1 if this < comparison, +1 if this > comparison
     */
    N.prototype.compare=function(comparison) {
        if (this.digits.length> comparison.digits.length) return 1;
        if (this.digits.length< comparison.digits.length) return -1;
        for (var i= this.digits.length-1; i>=0; i--) {
            if (this.digits[i]> comparison.digits[i]) return 1;
            if (this.digits[i]< comparison.digits[i]) return -1;
        }
        return 0;
    };

    /**
     * Create a positive version of the number given
     *
     * @param {module:N~N} number The number to copy and make positive
     * @return {module:N~N} A new number that is the positive version of number
     */
    N.abs=function(number) {
        return new N(number).abs();
    };

    /**
     * Make this number positive
     *
     * @return {module:N~N} This number for chaining purposes
     */
    N.prototype.abs=function() {
        if (this.isNegative()) this.negate();
        return this;
    };

    /**
     * Addition
     *
     * @param {module:N~N} number The number to add to this number
     * @return {module:N~N} This number for chaining purposes
     */
    N.prototype.add=function(number) {
        var i;
        this.safemaximum=this.safemaximum+number.safemaximum;
        if (this.safemaximum>=SQUAREBASE) this.normalise();
        var len=this.digits.length;
        if (number.digits.length>len) {
            this.digits.length=number.digits.length;
            for (i = len; i < number.digits.length; i++) this.digits[i] = number.digits[i];
        }
        for (i=Math.min(len,number.digits.length)-1; i>=0; i--) this.digits[i]+=number.digits[i];
        return this;
    };

    /**
     * Make this number the opposite sign
     *
     * If the number is positive it will be made negative, if negative it will be made positive
     *
     * @return {module:N~N} This number for chaining purposes
     */
    N.prototype.negate=function() {
        for (var i=0; i<this.digits.length; i++) this.digits[i]=-this.digits[i];
        return this;
    };

    /**
     * Subtraction
     *
     * @param {module:N~N} number The number to subtract from this number
     * @return {module:N~N} This number for chaining purposes
     */
    N.prototype.subtract=function(number) {
        var i;
        this.safemaximum=this.safemaximum+number.safemaximum;
        if (this.safemaximum>=SQUAREBASE) this.normalise();
        var len=this.digits.length;
        if (number.digits.length>len) {
            this.digits.length=number.digits.length;
            for (i = len; i < number.digits.length; i++) this.digits[i] = -number.digits[i];
        }
        for (i=Math.min(len,number.digits.length)-1; i>=0; i--) this.digits[i]-=number.digits[i];
        return this;
    };

    /**
     * Multiplication
     *
     * @param {module:N~N} number The number to multiply this number
     * @return {module:N~N} This number for chaining purposes
     */
    N.prototype.multiply=function(number) {
        var i;
        if (number.digits.length==0 || this.digits.length==0) return this.reset();
        if (number.digits.length==1) {
            var m=number.digits[0];
            this.safemaximum=this.safemaximum*Math.abs(m);
            if (this.safemaximum<SQUAREBASE) {
                for (i = this.digits.length - 1; i >= 0; i--) this.digits[i] *= m;
            }
            else this._digitMultiplyWithAdd(m,0);
            return this;
        }
        if (number.safemaximum>=BASE) number.normalise();
        if (this.safemaximum>=BASE) this.normalise();
        var operand=number.digits;
        var original=this.digits;
        this.digits=new Array(original.length+operand.length-1);
        for (i=0; i<this.digits.length; i++) this.digits[i]=0;

        if (original.length>3 && operand.length>3)
            return this._rapidMultiplication(original,operand,true)
                ._digitMultiplyWithAdd(ROOTBASE,0)
                ._rapidMultiplication(original,operand,false);
        else return this._basicMultiplication(original,operand);
    };

    /**
     * Multiplication by a single digit
     *
     * The number provided must be less than BASE
     *
     * @param {Number} digit The number to multiply with
     * @return {module:N~N} This number for chaining purposes
     */
    N.prototype.digitMultiply=function(digit) {
        return this._digitMultiplyWithAdd(digit,0);
    };

    /**
     * Sets a number to a random value that is roughly the number of decimal digits given
     *
     * @param {Number} digits The number of decimal digits required
     * @return {module:N~N} This number for chaining purposes
     */
    N.prototype.random=function(digits) {
        this.reset();
        var digitsPerElement = Math.log(BASE) / Math.log(10);
        for (var i=0; digits > digitsPerElement; i++) {
            this.digits[i]=Math.trunc(Math.random() * BASE);
            digits -= digitsPerElement;
        }
        this.digits[i]=Math.trunc((1+Math.random()) * Math.pow(10, digits));
        this.safemaximum=BASE-1;
        return this;
    };

    /**
     * The quotient of this number after dividing it by the number given
     *
     * @param {module:N~N} number The divisor
     * @return {module:N~N} This number for chaining purposes
     */
    N.prototype.quotient=function(number) {
        this.divide(number);
        return this;
    };

    /**
     * Division
     *
     * @param {module:N~N} number The number to divide into this number
     * @return {module:N~N} The remainder. *Note:* This number is not returned, unlike most other mutation operations
     * @throws {Error} If divisor is zero
     */
    N.prototype.divide=function(number) {
        var i, j;
        var remainder=new N();

        // Normalise our numbers
        if (number.safemaximum>=BASE) number.normalise();
        if (this.safemaximum>=BASE) this.normalise();

        // Check for zero
        if (this.digits.length==0) return remainder;
        if (number.digits.length==0) throw new Error('Attempt to divide by zero');

        // If dividing by a single digit we have a quick way of doing this
        if (number.digits.length==1) return remainder.set(this.digitDivide(number.digits[0]));

        // Get the sign of our numbers and prepare them for long division
        var s1=Math.sign(this.digits[this.digits.length-1]),s2=Math.sign(number.digits[number.digits.length-1]);

        if (s1<0) this.abs().positivise();
        else this.positivise();
        if (s2<0) number.abs().positivise();
        else number.positivise();

        var compare=this.compare(number);
        switch (compare) {
        case -1: // numerator < denominator; easy
            remainder=new N(this);
            this.reset();
            break;

        case 0: // numerator==denominator; even easier
            this.set(1);
            break;

        case 1: // numerator>denominator; trickier
            // Load up our remainder to close to the size of the denominator
            var numDigits=number.digits;
            var remDigits=remainder.digits=this.digits.slice(this.digits.length-number.digits.length);

            remainder.safemaximum=this.safemaximum;
            this.digits.length-=remDigits.length;

            var difference;
            // For each remaining digit in the numerator we get the digit that represents one step of the long division
            for (i = this.digits.length; i >= 0; i--) {
                this.digits[i] = 0;
                while (remainder.compare(number) >= 0) {
                    // If our remainder is greater then denominator, then we get a good estimate of how much greater in difference
                    difference = remDigits[remDigits.length - 1] * BASE + remDigits[remDigits.length - 2];
                    if (numDigits.length < remDigits.length) difference = Math.max(1, Math.trunc(difference / (numDigits[numDigits.length - 1] + (numDigits[numDigits.length - 2] + 1)/BASE)));
                    else difference = Math.max(1, Math.trunc(difference / (numDigits[numDigits.length - 1] * BASE + numDigits[numDigits.length - 2] + 1)));
                    // Accumulate the difference and reduce the remainder by that number of denominators ... and then compare again
                    this.digits[i] += difference;
                    remainder._subtractMultiple(numDigits, difference);
                    // More than likely our estimate was good and our remainder now stands at below the denominator, but we cant be sure...
                }
                if (i>0) {
                    // Considerably faster than Array.unshift() !!!
                    for (j=remDigits.length; j>0; j--) remDigits[j]=remDigits[j-1];
                    remDigits[0]=this.digits[i-1];
                }
            }
        }
        if (s1*s2<0) {
            // Set our results negative if our original numbers had different signs
            this.negate();
            remainder.negate();
        }
        while (this.digits.length>0 && this.digits[this.digits.length-1]==0) this.digits.length--;
        return remainder; // Returns the remainder - the 'this' number now contains the quotient
    };

    /**
     * Division by a single digit
     *
     * The number provided must be less than BASE
     *
     * @param {Number} digit The number to multiply with
     * @return {Number} The remainder
     */
    N.prototype.digitDivide=function(digit) {
        var temp;
        for (var i = this.digits.length - 1,overflow=0; i >= 0; i--) {
            temp = overflow * BASE + this.digits[i];
            this.digits[i] = Math.trunc(temp / digit);
            overflow = temp % digit;
        }
        while (this.digits.length>0 && this.digits[this.digits.length-1]==0) this.digits.length--;
        this.safemaximum=BASE-1;
        return overflow;
    };

    /**
     * Decimal value of this number
     *
     * @return {String} The full decimal representation of this number
     */
    N.prototype.toString=function() {
        var result=this.isNegative() ? '-' : '';

        var test=new N(this).abs().normalise().positivise();
        while (!test.isZero()) result=test.divide(N.TEN).lsb()+result;
        if (result.length==0) result='0';
        return result;
    };


    // A low level routine to multiply this number by a small number (<BASE) with
    // a carry digit to be added at the start
    N.prototype._digitMultiplyWithAdd=function(multiplier,digit) {
        if (this.safemaximum>=BASE) this.normalise(true);
        for (var i=0; i<this.digits.length; i++) {
            digit+=(this.digits[i]*multiplier);
            this.digits[i]=digit%BASE;
            digit=Math.trunc(digit/BASE);
        }
        if (digit) this.digits[this.digits.length]=digit;
        this.safemaximum=BASE-1;
        return this;
    };

    // A low level routine to multiply two numbers and accrue them in to this number
    // It is assumed that this number has been reset to contain the required number
    // of zero digits.
    N.prototype._basicMultiplication=function(a,b) {
        if (a.length> b.length) {var c=a; a=b; b=c;}
        for (var i= 0,j= 1,aDigit= 0,carry=0; i<a.length; i++) {
            aDigit=a[i]%BASE;
            for (j= 0,carry=0; j<b.length; j++) {
                carry+=(aDigit * b[j]+this.digits[i+j]);
                this.digits[i+j]=carry%BASE;
                carry = Math.trunc(carry / BASE);
            }
            if (carry) this.digits[i+j]=carry;
        }
        this.safemaximum=BASE-1;
        return this;
    };

    // A low level routine to part-multiply two numbers.
    // This semi-multiplication takes only half of each multicand number to avoid carry processing
    // For large numbers this makes for greater efficency. msb tells us which half of the multicand to take.
    N.prototype._rapidMultiplication=function(a,b,msb) {
        var q;
        if (a.length> b.length) {var c=a; a=b; b=c;}
        for (var i= a.length-1; i>=0; i--) {
            if (msb) q=Math.trunc(a[i]/ROOTBASE);
            else q=a[i]%ROOTBASE;
            if (q!=0) for (var j = b.length - 1; j >= 0; j--) this.digits[i + j] += q * b[j];
        }
        this.safemaximum*=ROOTBASE;
        return this;
    };

    // A low level routing to subtract a multiple of the given array of digits. This is used for efficient division
    // And requires that it yields a non-negative result
    N.prototype._subtractMultiple=function(number,digit) {
        for (var i = 0,remainder= 0,modulus=0; i < number.length; i++) {
            remainder+=(number[i] * digit);
            modulus = remainder % BASE;
            remainder = Math.trunc(remainder / BASE);
            if (modulus > this.digits[i]) {
                this.digits[i] += (BASE - modulus);
                remainder++;
            }
            else this.digits[i] -= modulus;
        }
        if (remainder) this.digits[i]-=remainder;
        while (this.digits.length>0 && this.digits[this.digits.length-1]==0) this.digits.length--;
    };

    //A rough estimate of the square root of a number used to test for prime factors
    N.prototype._roughSqrt=function() {
        var sqrt=new N();
        if (this.digits.length>0) {
            if (this.digits.length==1) sqrt.set(Math.ceil(Math.sqrt(this.digits[0])));
            else {
                var msd=Math.ceil(Math.sqrt(this.digits[this.digits.length-1]*BASE+this.digits[this.digits.length-2]+1));
                sqrt.digits=this.digits.slice(0,Math.trunc((this.digits.length-2)/2));
                if (this.digits.length%2==1) msd*=Math.sqrt(BASE);
                sqrt.digits.push(msd%BASE);
            }
        }
        return sqrt;
    };

    //Note that these constants are for convenience and must be used carefully so that they are not changed!
    N.ZERO=new N();
    N.ONE=new N().set(1);
    N.TWO=new N().set(2);
    N.TEN=new N().set(10);

    // Prime number generator. This class is used to iterate through prime numbers in order to find
    // common factors to a fraction to allow us to simplify that fraction
    N.Primes=(function() {
        var primes=[2,3];                     // cache of prime numbers

        // Instantiation sets up an iterator to start from the first prime (2)
        function Primes() {
            this.iterator=0;
        }

        // Calls to next() will deliver the next prime number.
        Primes.prototype.next=function() {
            if (this.iterator<primes.length) return primes[this.iterator++];
            var next=primes[primes.length-1];
            do {
                // Find the next prime number, though abandon if greater than BASE
                next+=2;
                if (next>=BASE) return 0;
                var sqrt = Math.sqrt(next);
                var prime=true;
                for (var i = 0; i < primes.length && primes[i]<=sqrt; i++) {
                    if (next%primes[i]==0) {
                        prime = false;
                        break;
                    }
                }
            } while (!prime);
            // Store this new prime number for subsequent use
            primes.push(next);
            this.iterator++;
            return next;
        };

        return Primes;
    })();

    // A temporary number that is used in interim calculations to improve performance
    var temporary=new N();
    N.temporary=function(number) {
        temporary.digits.length=number.digits.length;
        for (var i=0; i<number.digits.length; i++) temporary.digits[i]=number.digits[i];
        temporary.safemaximum=number.safemaximum;
        return temporary;
    };

    return N;
})();
