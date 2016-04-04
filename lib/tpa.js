/**
 * @file The complete code for Total Precision Arithmetic
 * @author Dominic Thwaites
 * @copyright (c) 2016 Dominic Thwaites dominicthwaites@mac.com
 * @version 1.0.6
 */

!(/** @lends DJT*/function() {

    var INPUT_ERROR_MESSAGE='Number initialisation parameter badly formed';
    var BASE;                   // The BASE to which numbers are stored
    var VALUE_DECIMAL_PLACES=8; // # DPs to take from a numeric construction and to output with the value() method
    var ROOTBASE;               // The square root of BASE
    var SQUAREBASE;             // The square of the BASE - i.e. the maximum number able to be expressed accurately within a digit


    /**
     * Tpa stores and manipulates rational numbers with total precision
     *
     * @param {number|string|DJT~Tpa} [initialValue] Initial value to set this number.
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

    /**
     * Sets the BASE to which numbers are internally represented.
     *
     * This should *only* be set for experimentation and testing purposes. Any existing instances of Tpa will become corrupt or invalid once the base is changed.
     * Safe rule: Don't call this set method!
     *
     * @param {number} base The new BASE for number internal representation
     */
    Tpa.setBASE=function(base) {
        BASE=base;
        ROOTBASE=Math.floor(Math.sqrt(BASE));
        SQUAREBASE=Math.pow(BASE,2);
    };

    /**
     * The BASE to which all numbers is stored.
     *
     * This is preset to 2^25 which is the optimal size. However, it may be lower (not higher!) in order to test the integrity of internal representation and manipulation of numbers.
     *
     * @returns {number}
     */
    Tpa.getBASE=function() {
        return BASE;
    };

    Tpa.setBASE(Math.pow(2,25));

    var N=(/** @lends Tpa */function() {
        /**
         * N is the core vehicle to store and manipulate arbitrarily long integers
         *
         * This class is not intended for external use and is *only* used internally by the TPA class.
         * It does not form any part of the TPA API. It is documented here for developer convenience and interest.
         *
         * For efficiency reasons many methods do not have error checking or may make assumptions about the state of the number.
         * Any assumptions, however, are documented.
         *
         * @param {number|string|Tpa~N} [initialValue] The initial value assigned to this number.
         * This may be a JS numeric value, a string or another N instance. If numeric, any fractional part is ignored.
         * If string it may only contain digits starting with an optional + or - sign. If N, the new N will be a duplicate.
         * @constructor
         * @throws {Error} If parameter passed is not one of the above or is badly formed.
         */
        var N=function(initialValue) {
            if (this instanceof N) {
                this.reset();
                if (arguments.length==0) return;
                if (initialValue instanceof N) {
                    this.digits=initialValue.digits.slice(0);
                    this.safemaximum=initialValue.safemaximum;
                } else {
                    if (typeof initialValue == 'number') {
                        if (isNaN(initialValue)) throw new Error(INPUT_ERROR_MESSAGE);
                        else this.set(Math.trunc(initialValue));
                    } else {
                        if (typeof initialValue == 'string') {
                            var sign=initialValue[0]=='-'? -1 : 1;
                            for (var i=(initialValue[0]=='-' || initialValue[0]=='+' ? 1 : 0); i<initialValue.length && /^\d$/.test(initialValue[i]); i++) {
                                this._digitMultiplyWithAdd(10, sign*parseInt(initialValue[i]));
                            }
                            if (i!=initialValue.length) throw new Error(INPUT_ERROR_MESSAGE);
                        } else throw new Error(INPUT_ERROR_MESSAGE);
                    }
                }
            } else {
                if (typeof initialValue=='undefined') return new N();
                else return new N(initialValue);
            }
        };

        /**
         * Ensures that all digits of this number are less than the BASE
         *
         * Internal representation allows for digits to exceed BASE. Normalisation
         * is necessary where an impending operation depends on this not being the case.
         * Note also that normalisation does *not* remove negative digits that are
         * also permitted. Again, for some operations, negative digits are undesired
         * and the positivise method is required to remove them.
         *
         * @see positivise
         * @param {boolean} [noReduction=false] set to true if we wish to keep any trailing zero digits
         * @returns {Tpa~N} This number for chaining purposes
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
         * This function *only* should be called once it is established that the number is both positive overall
         * and is normalised.
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
         * @returns {boolean} `true` if this number is negative, false if zero or positive
         */
        N.prototype.isNegative=function() {
            if (this.isZero()) return false;
            return this.digits[this.digits.length-1]<0;
        };

        /**
         * @returns {boolean} `true` if this number is zero
         */
        N.prototype.isZero=function() {
            return this.normalise().digits.length==0;
        };

        /**
         * @returns {boolean} `true` if this number is positive, false if zero or negative
         */
        N.prototype.isPositive=function() {
            if (this.isZero()) return false;
            return this.digits[this.digits.length-1]>0;
        };

        /**
         * @returns {number} The least significant digit of the number or 0 if zero
         */
        N.prototype.lsb=function() {
            return this.isZero() ? 0 : (BASE+this.digits[0])%BASE;
        };

        /**
         * Resets number to zero
         *
         * @returns {Tpa~N} This number for chaining purposes
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
         * @param {number} testDivisor The number to test as a factor of this number
         * @return {boolean} `true` if this number is divisible by the test-divisor
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
         * @param {number} newValue As per instantiation, setting Tpa with a JS native number is subject to accuracy constraints
         * @return {Tpa~N} This number for chaining purposes
         */
        N.prototype.set=function(newValue) {
            this.reset();
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
         * @return {number} The value of this number accurate to within the bounds of JS native floating point number
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
         * @see positivise
         * @param {Tpa~N}  comparison The number to compare with this number
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
         * @param {Tpa~N} number The number to copy and make positive
         * @return {Tpa~N} A new number that is the positive version of number
         */
        N.abs=function(number) {
            return new N(number).abs();
        };

        /**
         * Make this number positive
         *
         * @return {Tpa~N} This number for chaining purposes
         */
        N.prototype.abs=function() {
            if (this.isNegative()) this.negate();
            return this;
        };

        /**
         * Addition
         *
         * @param {Tpa~N} number The number to add to this number
         * @return {Tpa~N} This number for chaining purposes
         */
        N.prototype.add=function(number) {
            var i;
            this.safemaximum=this.safemaximum+number.safemaximum;
            if (this.safemaximum>=SQUAREBASE) this.normalise();
            var len=this.digits.length;
            this.digits.length=Math.max(this.digits.length,number.digits.length);
            for (i = len; i < number.digits.length; i++) this.digits[i] = number.digits[i];
            for (i=Math.min(len,number.digits.length)-1; i>=0; i--) this.digits[i]+=number.digits[i];
            return this;
        };

        /**
         * Make this number the opposite sign
         *
         * If the number is positive it will be made negative, if negative it will be made positive
         *
         * @return {Tpa~N} This number for chaining purposes
         */
        N.prototype.negate=function() {
            for (var i=0; i<this.digits.length; i++) this.digits[i]=-this.digits[i];
            return this;
        };

        /**
         * Subtraction
         *
         * @param {Tpa~N} number The number to subtract from this number
         * @return {Tpa~N} This number for chaining purposes
         */
        N.prototype.subtract=function(number) {
            var i;
            this.safemaximum=this.safemaximum+number.safemaximum;
            if (this.safemaximum>=SQUAREBASE) this.normalise();
            var len=this.digits.length;
            this.digits.length=Math.max(this.digits.length,number.digits.length);
            for (i = len; i < number.digits.length; i++) this.digits[i] = -number.digits[i];
            for (i=Math.min(len,number.digits.length)-1; i>=0; i--) this.digits[i]-=number.digits[i];
            return this;
        };

        /**
         * Multiplication
         *
         * @param {Tpa~N} number The number to multiply this number
         * @return {Tpa~N} This number for chaining purposes
         */
        N.prototype.multiply=function(number) {

            if (number.digits.length==0 || this.digits.length==0) return this.reset();
            if (number.digits.length==1) {
                var m=number.digits[0];
                this.safemaximum=this.safemaximum*Math.abs(m);
                if (this.safemaximum<SQUAREBASE) {
                    for (var i = this.digits.length - 1; i >= 0; i--) this.digits[i] *= m;
                }
                else this._digitMultiplyWithAdd(m,0);
                return this;
            }
            if (number.safemaximum>=BASE) number.normalise();
            if (this.safemaximum>=BASE) this.normalise();
            var operand=number.digits;
            var original=this.digits;
            this.digits=new Array(original.length+operand.length-1);
            for (var i=0;i<this.digits.length;i++) this.digits[i]=0;

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
         * @param {number} digit The number to multiply with
         * @return {Tpa~N} This number for chaining purposes
         */
        N.prototype.digitMultiply=function(digit) {
            return this._digitMultiplyWithAdd(digit,0);
        };

        /**
         * Sets a number to a random value that is roughly the number of decimal digits given
         *
         * @param {number} digits The number of decimal digits required
         * @return {Tpa~N} This number for chaining purposes
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
         * @param {Tpa~N} number The divisor
         * @return {Tpa~N} This number for chaining purposes
         */
        N.prototype.quotient=function(number) {
            this.divide(number);
            return this;
        };

        /**
         * Division
         *
         * @param {Tpa~N} number The number to divide into this number
         * @return {Tpa~N} The remainder. *Note:* This number is not returned, unlike most other mutation operations
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
                // For each remaining digit in the numerator we get the digit that represents on step of the long division
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
         * @param {number} digit The number to multiply with
         * @return {Tpa~N} This number for chaining purposes
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
         * @return {string} The full decimal representation of this number
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

        /**
         * A rough estimate of the square root of a number used to test for prime factors
         *
         * @private
         * @returns {Tpa~N} An approximate square root of this number
         */
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

        return N;
    })();

    // Utility function to return a remainder in standard form
    function standardRemainder(numerator,denominator) {
        return {
            numerator: numerator instanceof N ? numerator : new Tpa.N(),
            denominator: denominator instanceof N ? denominator : new Tpa.N(1)
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
        switch (arguments.length) {
        case 0:
            return this.set();
        case 1:
            return this.set(initial);
        default:
            return this.set(initial, integer);
        }
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
    Tpa.prototype.set=function(initial,integer) {
        var me = this;
        // Establish whether this instance is to be an integer only
        this.integer=true;
        if (typeof initial == 'boolean') this.integer=initial;
        if (typeof integer=='boolean') this.integer=integer;

        // If the constructor argument is an instance of this class then we return a copy of that instance
        if (initial instanceof Tpa) {
            this.number=new N(initial.number);
            if (!(typeof integer == 'boolean') && initial.isFractional()) this.integer=false;
            if (!this.integer) {
                if (initial.isInteger()) this.remainder=standardRemainder();
                else {
                    this.remainder = {
                        numerator: new N(initial.remainder.numerator),
                        denominator: new N(initial.remainder.denominator)
                    };
                }
            }
            return this;
        }

        // If the constructor argument is a number then we preset this number with the number given
        if (typeof initial == 'number') {
            this.number=new N(initial);
            var denominator=Math.pow(10,VALUE_DECIMAL_PLACES);
            var numerator=Math.trunc((initial-Math.trunc(initial)).toFixed(VALUE_DECIMAL_PLACES)*denominator);

            // Note that the fractional part only takes 8 decimal places (as per VALUE_DECIMAL_PLACES)
            if (typeof integer!='boolean' || !this.integer) {
                if (typeof integer!='boolean') this.integer=numerator==0;
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

        if (typeof initial == 'string') {
            initial=initial.trim();
            if (!this.integer) this.remainder=standardRemainder();
            if (initial.match(/^[\+\-]?\d+\/\d+$/)) {                               // [+/-]nnn/nnn
                if (typeof integer != 'boolean') this.integer = false;
                this.number=new N();
                parseFraction(initial);
            } else {
                var sign=initial[0]=='-';
                if (initial.match(/^[\+\-]?\d*/)===null) throw new Error(INPUT_ERROR_MESSAGE);
                this.number=new N(initial.match(/^[\+\-]?\d*/)[0]);                 // [+/-]nnn
                if (initial.match(/^[\+\-]?\d*$/)) return this;
                var match=initial.match(/^[\+\-]?\d*([\. ])/);
                if (match===null) throw new Error(INPUT_ERROR_MESSAGE);
                var remaining=initial.match(/^[\+\-]?\d*[\. ](.*)/)[1];             // [+/-]nnn[./ ]
                if (typeof integer != 'boolean') this.integer = false;
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

        if (typeof initial=='undefined' && arguments.length>0) throw new Error(INPUT_ERROR_MESSAGE);
        // If we had no initialiser, then set this number to zero
        this.number=new Tpa.N();
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
        var primes=new Tpa.N.Primes();
        var start=new Date().getTime();
        var factor=new Tpa.N().set(1);

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
                this.remainder.numerator.multiply(new N(number.remainder.numerator).add(new N(number.remainder.denominator).multiply(number.number)));
                this.remainder.numerator.add(new N(number.remainder.numerator).multiply(this.number).multiply(this.remainder.denominator));
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
                this.remainder.numerator =this.number.divide(this.remainder.denominator.multiply(new N(number.number).multiply(number.remainder.denominator).add(number.remainder.numerator)));
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
                this.remainder.numerator.subtract(new N(number.remainder.numerator).multiply(this.remainder.denominator));
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
                this.remainder.numerator.add(new N(number.remainder.numerator).multiply(this.remainder.denominator));
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

    /**
     * @lends toDecimal
     */
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
    Tpa.N=N;

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

    // CommonJS
    /*global define*/
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = Tpa;
    } else if (typeof define === 'function' && define.amd) {
        define(['Tpa'], Tpa);
    } else if (typeof window !== 'undefined') {
        window.Tpa = Tpa;
    }
})();
