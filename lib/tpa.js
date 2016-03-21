!(/** @lends TPA */function() {


    function standardRemainder() {
        return {
            numerator: new Tpa.N(),
            denominator: new Tpa.N().set(1)
        };
    }

    var Tpa=function(initial,integer) {

        if (!(this instanceof Tpa)) {
            if (initial instanceof Tpa && (typeof integer!='boolean' || integer==initial.integer)) return initial;
            switch (arguments.length) {
            case 0:
                return new Tpa();
            case 1:
                return new Tpa(initial);
            default:
                return new Tpa(initial,integer);
            }
        }

        this.integer=true;
        if (typeof initial == 'boolean') this.integer=initial;
        if (typeof integer=='boolean') this.integer=integer;

        if (initial instanceof Tpa) {
            this.number=initial.number.copy();
            if (!(typeof initial == 'boolean') && initial.isFractional()) this.integer=false;
            if (!this.integer) {
                if (initial.isInteger()) this.remainder=standardRemainder();
                else {
                    this.remainder = {
                        numerator: initial.remainder.numerator.copy(),
                        denominator: initial.remainder.denominator.copy()
                    };
                }
            }
            this.sign=initial.sign;
            return;
        }

        if (typeof initial == 'number') {
            if (isNaN(initial)) {
                throw new Error('N provided is not valid - NaN');
            }
            this.sign=initial<0 ? -1 : 1;
            initial=Math.abs(initial);
            this.number=new Tpa.N().set(Math.floor(initial));
            var fixed=Math.floor(Math.log(Tpa.N.BASE)/Math.log(10));
            var denominator=Math.pow(10,fixed);
            var numerator=Math.floor((initial-Math.floor(initial)).toFixed(fixed)*denominator);

            if (typeof integer!='boolean' || !this.integer) {
                if (typeof integer!='boolean') this.integer=numerator==0;
                while (numerator != 0 && numerator % 10 == 0) {
                    numerator/=10;
                    denominator/=10;
                }
                if (numerator>0 || !this.integer) {
                    this.integer=false;
                    this.remainder = {
                        numerator: new Tpa.N().fullshift(numerator),
                        denominator: new Tpa.N().fullshift(denominator)
                    };
                }
            }
            return;
        }

        function parseInteger() {
            for (var number=new Tpa.N(); index<initial.length && /^\d$/.test(initial[index]); index++) {
                number.digitmultiply(10, parseInt(initial[index]));
            }
            return number;
        }

        function parseDecimal() {
            var remainder=standardRemainder();
            for (var recurring=null; index<initial.length; index++) {
                if (initial[index]=='[' && recurring===null) {
                    recurring = {
                        numerator: remainder.numerator.copy(),
                        denominator: remainder.denominator.copy()
                    };
                    continue;
                }
                if (recurring && initial[index]==']') {
                    if (index!=initial.length-1) throw new Error('No characters should follow the closure of the recurring part');
                    if (remainder.numerator.isZero()) throw new Error('At least one digit needs to follow the recurring indicator ([)');
                    if (initial[index-1]=='[') throw new Error('N not valid - empty recurring section');
                    remainder.numerator.subtract(recurring.numerator);
                    remainder.denominator.subtract(recurring.denominator);
                    return remainder;
                }
                if (/^\d$/.test(initial[index])) {
                    remainder.denominator.digitmultiply(10, 0);
                    remainder.numerator.digitmultiply(10, parseInt(initial[index]));
                } else throw new Error('N not valid - unrecognised character after decimal point');
            }
            if (recurring) throw new Error('Number not valid - incomplete recurring section');
            return remainder;
        }

        function parseFraction() {
            var remainder={};
            remainder.numerator=parseInteger();
            if (index==initial.length || initial[index]!='/' || remainder.numerator.isZero()) throw new Error('Number not valid - fractional numerator not a positive integer');
            index++;
            remainder.denominator=parseInteger();
            if (index!=initial.length || remainder.denominator.isZero()) throw new Error('Number not valid - fractional denominator not a positive integer');
            return remainder;
        }


        function normaliseRemainder(remainder) {
            var numerator=remainder.numerator.divide(remainder.denominator);
            var result=remainder.numerator;
            remainder.numerator=numerator;
            return result;
        }

        if (typeof initial == 'string') {
            this.sign=initial[0]=='-'? -1 : 1;
            var index=initial[0]=='-' || initial[0]=='+' ? 1 : 0;
            this.number=parseInteger();
            if (index==initial.length) {
                if (!this.integer) this.remainder=standardRemainder();
            } else {
                index++;
                var remainder;
                switch (initial[index-1]) {
                case '.':
                    if (typeof integer != 'boolean') this.integer = false;
                    if (!this.integer) this.remainder = parseDecimal();
                    break;

                case ' ':
                    if (typeof integer != 'boolean') this.integer = false;
                    remainder = parseFraction();
                    this.number.add(normaliseRemainder(remainder).setSign(this.sign));
                    if (!this.integer) this.remainder=remainder;
                    break;

                case '/':
                    if (this.number.isZero()) throw new Error('Number not valid - fraction only input must have a numerator');
                    if (typeof integer != 'boolean') this.integer = false;
                    remainder={
                        numerator: this.number,
                        denominator: parseInteger()
                    };
                    if (index!=initial.length || remainder.denominator.isZero()) throw new Error('Number not valid - fractional denominator must be a positive integer');
                    this.number=normaliseRemainder(remainder);
                    if (!this.integer) this.remainder=remainder;
                    break;

                default:
                    throw new Error('Number not valid - unrecognised character in number');
                }
            }
            if (this.isZero()) this.sign=1;
            return;
        }

        if (typeof initial=='undefined' && arguments.length>0) throw Error('Initial value setting of TPA is undefined');
        this.number=new Tpa.N();
        if (!this.integer) {
            this.remainder = {
                numerator: new Tpa.N(),
                denominator: new Tpa.N().set(1)
            };
        }
        this.sign=1;
    };

    Tpa.prototype.simplify=function(milliseconds) {

        if (arguments.length>0 && (typeof milliseconds!='number' || isNaN(milliseconds)))
            throw new Error('Simplify() takes an optional numeric argument specifying the maximum number of millisecondsto process');
        if (typeof milliseconds=='undefined') milliseconds=100;
        if (this.isInteger() || this.remainder.numerator.isZero()) return true;
        var limit=this.remainder.numerator.roughSqrt().value();
        var primes=new Tpa.N.Primes();
        var start=new Date().getTime();
        var factor=new Tpa.N().set(1);
        for (var prime= primes.next(); prime>0 && prime<=limit; prime= primes.next()) {
            while (this.remainder.numerator.isDivisibleBy(prime)) {
                this.remainder.numerator.digitdivide(prime);
                if (this.remainder.denominator.isDivisibleBy(prime)) this.remainder.denominator.digitdivide(prime);
                else factor.digitmultiply(prime,0);
            }
            var now=new Date().getTime();
            if (now-start>milliseconds && milliseconds>0) {
                prime=0;
                break;
            }
        }
        var denominator=this.remainder.denominator.copy();
        var remainder=denominator.divide(this.remainder.numerator);
        if (remainder.isZero()) {
            this.remainder.denominator=denominator;
            this.remainder.numerator=factor;
            return true;
        } else this.remainder.numerator.multiply(factor);
        return prime>0;
    };

    Tpa.prototype.makeInteger=function() {
        this.integer=true;
        delete this.remainder;
    };

    Tpa.prototype.makeFractional=function() {
        this.integer=false;
        this.remainder = standardRemainder();
    };

    Tpa.prototype.isInteger=function() {
        return this.integer;
    };

    Tpa.prototype.isFractional=function() {
        return !this.integer;
    };

    Tpa.prototype.isNegative=function() {
        return this.sign<0;
    };

    Tpa.prototype.isPositive=function() {
        return this.sign>0;
    };

    Tpa.prototype.isZero=function() {
        return this.number.isZero() && (this.isInteger() || this.remainder.numerator.isZero());
    };

    Tpa.prototype.hasFraction=function() {
        if (this.integer) return false;
        return !this.remainder.numerator.isZero();
    };

    Tpa.prototype.value=function() {
        if (this.integer) return this.sign*this.number.value();
        else {
            var numerator = this.remainder.numerator.copy().fullshift(0).fullshift(0);
            numerator.divide(this.remainder.denominator);
            return this.sign * (this.number.value() + numerator.value() / Math.pow(Tpa.N.BASE, 2));
        }
    };

    Tpa.int=function(a) {
        return new Tpa(a.int());
    };

    Tpa.frac=function(a) {
        return new Tpa(a.frac());
    };

    Tpa.add=function(a,b) {
        return new Tpa(a).add(b);
    };

    Tpa.subtract=function(a,b) {
        return new Tpa(a).subtract(b);
    };

    Tpa.multiply=function(a,b) {
        return new Tpa(a).multiply(b);
    };

    Tpa.divide=function(a,b) {
        return new Tpa(a).divide(b);
    };

    Tpa.mod=function(a,b) {
        return new Tpa(a).mod(b);
    };

    Tpa.int=function(a) {
        return new Tpa(a).int();
    };

    Tpa.random=function(digits) {
        if (typeof digits=='number' && digits>0) {
            var result=new Tpa();
            result.number.random(digits);
        } else throw new Error('You must specify a positive number of decimal digits as an approximate size for this number');
        return result;
    };

    Tpa.prototype.compare=function(tpa) {
        tpa = Tpa(tpa);
        if (this.sign!=tpa.sign) return this.sign;
        var result = this.number.compare(tpa.number);
        if (result == 0 && this.isFractional()) {
            if (tpa.isFractional()) result=this.remainder.numerator.copy().multiply(tpa.remainder.denominator).compare(this.remainder.denominator.copy().multiply(tpa.remainder.numerator));
            else if (!this.remainder.numerator.isZero()) result=1;
        }
        return result;
    };

    Tpa.prototype.lt=function(tpa) {
        return this.compare(tpa)==-1;
    };

    Tpa.prototype.lte=function(tpa) {
        return this.compare(tpa)!=1;
    };

    Tpa.prototype.gt=function(tpa) {
        return this.compare(tpa)==1;
    };

    Tpa.prototype.gte=function(tpa) {
        return this.compare(tpa)!=-1;
    };

    Tpa.prototype.eq=function(tpa) {
        return this.compare(tpa)==0;
    };

    Tpa.prototype.int=function() {
        if (!this.integer) {
            this.remainder.numerator.reset();
            this.remainder.denominator.set(1);
        }
        return this;
    };

    Tpa.prototype.frac=function() {
        this.number.reset();
        return this;
    };

    Tpa.prototype.normaliseRemainder=function() {
        if (this.isFractional()) {
            if (this.remainder.numerator.compare(this.remainder.denominator) >= 0) {
                var numerator = this.remainder.numerator.divide(this.remainder.denominator);
                Tpa.N.combine(this.number,this.remainder.numerator);
                this.remainder.numerator = numerator;
            }
            if (this.remainder.numerator.isZero()) this.remainder.denominator.set(1);
        }
    };

    Tpa.prototype.multiply=function(tpa) {
        if (tpa==this) tpa=new Tpa(tpa);
        else tpa=Tpa(tpa);
        tpa.number.sign=1;
        this.number.sign=1;
        this.sign*=tpa.sign;
        if (this.isFractional()) {
            if (tpa.isFractional()) {
                this.remainder.numerator.multiply(Tpa.N.combine(tpa.remainder.numerator.copy(),tpa.remainder.denominator.copy().multiply(tpa.number)));
                Tpa.N.combine(this.remainder.numerator,tpa.remainder.numerator.copy().multiply(this.number).multiply(this.remainder.denominator));
                this.remainder.denominator.multiply(tpa.remainder.denominator);
            } else this.remainder.numerator.multiply(tpa.number);
            this.number.multiply(tpa.number);
            this.normaliseRemainder();
        } else this.number.multiply(tpa.number);
        return this;
    };

    Tpa.prototype.divide=function(tpa) {
        if (tpa==this) tpa=new Tpa(tpa);
        else tpa=Tpa(tpa);
        tpa.number.sign=1;
        this.number.sign=1;
        this.sign*=tpa.sign;
        if (this.isFractional()) {
            if (tpa.isFractional()) {
                Tpa.N.combine(this.number.multiply(this.remainder.denominator),this.remainder.numerator).multiply(tpa.remainder.denominator);
                this.remainder.numerator =this.number.divide(this.remainder.denominator.multiply(Tpa.N.combine(tpa.number.copy().multiply(tpa.remainder.denominator),tpa.remainder.numerator)));
            } else {
                Tpa.N.combine(this.number.multiply(this.remainder.denominator),this.remainder.numerator);
                this.remainder.numerator = this.number.divide(this.remainder.denominator.multiply(tpa.number));
            }

        } else this.number.divide(tpa.number);
        return this;
    };

    Tpa.prototype.mod=function(tpa) {
        if (tpa==this) tpa=this.copy();
        else tpa=Tpa(tpa);
        this.number=this.number.divide(tpa.number);
        if (this.isFractional()) this.remainder=standardRemainder();
        return this;
    };

    Tpa.prototype.subtract=function(tpa) {
        return addorsubtract.call(this,tpa,-1);
    };

    Tpa.prototype.add=function(tpa) {
        return addorsubtract.call(this,tpa,1);
    };

    function addorsubtract(tpa,sign) {
        if (tpa==this) tpa=new Tpa(tpa);
        else tpa=Tpa(tpa);
        tpa.number.sign=tpa.sign*sign;
        this.number.sign=this.sign;
        this.number=Tpa.N.combine(this.number,tpa.number);

        if (this.isFractional()) {
            this.remainder.numerator.sign=this.sign;
            if (tpa.isFractional() && !tpa.remainder.numerator.isZero()) {
                tpa.remainder.numerator.sign = tpa.sign*sign;
                this.remainder.numerator = Tpa.N.combine(this.remainder.numerator.copy().multiply(tpa.remainder.denominator), tpa.remainder.numerator.copy().multiply(this.remainder.denominator));
                this.remainder.denominator.multiply(tpa.remainder.denominator);
            }
            if (this.remainder.numerator.sign!=this.number.sign) {
                if (this.number.isZero()) this.number.sign=-this.number.sign;
                else {
                    this.number = Tpa.N.combine(this.number, new Tpa.N().set(1).setSign(this.remainder.numerator.sign));
                    if (this.number.isZero()) this.number.sign=-this.remainder.numerator.sign;
                    this.remainder.numerator = Tpa.N.combine(this.remainder.numerator.setSign(-1),this.remainder.denominator);
                }
            }
            this.normaliseRemainder();
        }
        this.sign=this.number.sign;
        return this;
    }

    Tpa.prototype.toDecimal=function(maxdp) {
        return this.toString(maxdp);
    };

    Tpa.prototype.toFraction=function() {
        if (this.isInteger()) return this.toString();
        var result='';
        if (this.sign<0) result='-'+result;
        var number=new Tpa();
        number.number=this.number;
        result+=number.toString();
        if (!this.remainder.numerator.isZero()) {
            number.number=this.remainder.numerator;
            result=result+' '+number.toString();
            number.number=this.remainder.denominator;
            result=result+'/'+number.toString();
        }
        return result;
    };

    Tpa.prototype.toString=function(maxdp) {
        if (typeof maxdp != 'number' || isNaN(maxdp)) maxdp=100;
        var result='';

        var ten=new Tpa.N().set(10);
        var test=this.number.copy('fn_toString');
        while (!test.isZero()) {
            result=test.divide(ten).longs[0]+result;
        }
        if (this.sign<0) result='-'+result;
        if (this.isFractional() && !this.remainder.numerator.isZero()) {
            if (this.number.isZero()) result+='0';
            result+='.';
            var numeratorstore=[];
            for (var numerator=this.remainder.numerator.copy('fn_tostring'),remainder=0; !numerator.isZero() && maxdp>0; numerator=remainder,maxdp--) {
                for (var i=numeratorstore.length-1; i>=0; i--) {
                    if (numeratorstore[i].compare(numerator)==0) break;
                }
                if (i>=0) {
                    result=result.substr(0,result.length+i-numeratorstore.length)+'['+result.substr(result.length+i-numeratorstore.length)+']';
                    break;
                }
                numeratorstore.push(numerator.copy());
                remainder = numerator.digitmultiply(10, 0).divide(this.remainder.denominator);
                result+=numerator.longs[0];
            }
            if (maxdp==0 && !numerator.isZero()) result=result+'...';
        } else {
            if (this.number.isZero()) result='0';
        }
        return result;
    };

    Tpa.N=(function() {
        var fullbase=Math.pow(2,32);
        var halfbase=Math.pow(2,16);

        var workers={};

        /**
         * Number is the core vehicle to store amd manipulate arbitrarily long integers
         *
         * Storage space is automatically managed and may grow and shrink in response
         * to the current size of the number
         *
         * This class is thorough and encapsulated, but is not fool proof and needs to be used with understanding.
         * It is private to Tpa and some methods have intentional side effects and demands. For example,
         * the subtract() method requires the first argument to be grater or equal to the second. Or the sum()
         * method sums numbers into the first element of the array given - i.e. modifies it. This is all
         * done in the interests of performance and not for fool-proofness.
         *
         * @param {number} [size=1] The number of 64 bit blocks to allocate for storage
         * @constructor
         */
        var N=function(size) {
            this.sign=1;        // 1=zero or positive, -1=negative
            this.longcount=0;   // The number of 32 bit unsigned integers holding the number
            this.shortcount=0;  // The number of 16 bit unsigned integers holding the number
            if (!(typeof size=='number') || !(size>0)) size=8;
            this.setSize(size); // Allocates storage
        };

        N.prototype.setSize=function(size) {
            if (this.size>size) return;
            this.size=size;     // The number of 64 bit blocks available for the number
            var buffer=new ArrayBuffer(this.size*8);// Allocate buffer size in bytes
            var longs=new Uint32Array(buffer,0);
            if (this.longs) longs.set(this.longs);  // If necessary, transfer bytes from previous storage
            this.buffer=buffer;                     // The data buffer for storage
            this.longs=longs;                       // A 32bit word view on the buffer
            this.shorts=new Uint16Array(buffer,0);  // A 16bit word view on the same buffer
        };

        N.prototype.overwrite=function(number) {
            // If the sizes are different we perform the (slightly expensive) operation to allocate a new buffer
            if (this.size!=number.size) {
                this.size=number.size;
                this.buffer=new ArrayBuffer(this.size*8);
                this.longs=new Uint32Array(this.buffer,0);
                this.shorts=new Uint16Array(this.buffer,0);
            }
            // Copy the details from the N provided into this number
            this.longs.set(new Uint32Array(number.buffer,0,number.longcount));
            this.sign = number.sign;
            this.longcount = number.longcount;
            this.shortcount = number.shortcount;
        };

        N.prototype.copy=function(name) {
            var result;
            if (typeof name == 'undefined') result=new N(this.size);
            else {
                if (!(name in workers)) workers[name]=[];
                if (!(this.size in workers[name])) workers[name][this.size]=new N(this.size);
                result=workers[name][this.size];
            }
            result.longs.set(new Uint32Array(this.buffer,0,this.longcount));
            result.sign = this.sign;
            result.size=this.size;
            result.longcount = this.longcount;
            result.shortcount = this.shortcount;
            return result;
        };

        N.prototype.roughSqrt=function() {
            var sqrt=new N();
            var msd=this.shorts[this.shortcount]*halfbase+this.shorts[this.shortcount-1]+1;
            var size=(this.shortcount-1+Math.log(msd)/Math.log(halfbase))/2;
            sqrt.setSize(Math.ceil(size));
            sqrt.shorts[Math.floor(size)]=Math.ceil(Math.pow(halfbase,size-Math.floor(size)));
            return sqrt.setCount(Math.ceil(size)*2);
        };

        N.prototype.isDivisibleBy=function(factor) {
            var i;
            if (factor<halfbase) {
                for (i = this.longcount - 1, temp = 0; i >= 0; i--) {
                    temp = (temp % factor) * fullbase + this.longs[i];
                }
                return temp % factor == 0;
            } else {
                if (factor < fullbase) {
                    for (i = this.shortcount - 1, temp = 0; i >= 0; i--) {
                        var temp = (temp % factor) * halfbase + this.shorts[i];
                    }
                    return temp % factor == 0;
                } else throw new Error('Internal error - isDivisibleBy() only accepts divisors less than N.BASE');
            }
        };

        N.prototype.checkSize=function(increase) {
            if ((this.longcount/2+increase)*8>this.buffer.byteLength) {
                this.setSize(Math.pow(2,Math.ceil(Math.log(this.size+increase)/Math.log(2))));
            }
        };

        N.prototype.isZero=function() {
            return this.shortcount==0;
        };

        N.prototype.value=function() {
            var result=0;
            for (var i=this.longcount-1; i>=0; i--) {
                result+=(this.longs[i]*Math.pow(fullbase,i));
            }
            return result;
        };

        //1: a>b, -1 a<b, 0 a=b
        N.prototype.compare=function(number) {
            if (this.shortcount> number.shortcount) return 1;
            if (this.shortcount< number.shortcount) return -1;
            for (var i= this.longcount-1; i>=0; i--) {
                if (this.longs[i]> number.longs[i]) return 1;
                if (this.longs[i]< number.longs[i]) return -1;
            }
            return 0;
        };

        N.prototype.setSign=function(sign) {
            this.sign=sign;
            return this;
        };

        N.combine=function(a,b) {
            if (a.compare(b)==1) {
                if (a.sign!= b.sign) a.subtract(b);
                else a.add(b);
            }
            else {
                if (a.sign!= b.sign) a.overwrite(b.copy('add_temp').subtract(a));
                else a.overwrite(b.copy('add_temp').add(a));
            }
            return a;
        };

        /**
         * Adds the given number to this number
         *
         * @param number
         * @returns {N}
         */
        N.prototype.add=function(number) {
            this.checkSize(1);
            for (var i= 0,digit=0; i<number.longcount || digit; i++) {
                digit+=(this.longs[i]+number.longs[i]);
                this.longs[i]=digit;
                digit=Math.floor(digit/fullbase);
            }
            if (i>=this.longcount) this.setCount(i*2);
            return this;
        };

        N.prototype.subtract=function(number) {
            for (var i = 0,digit= 0,carry=0; i < number.longcount && (i<this.longcount || carry); i++) {
                digit=this.longs[i] - number.longs[i]-carry;
                carry=digit<0 ? 1 : 0;
                if (carry) this.longs[i] = digit+fullbase;
                else this.longs[i]=digit;
            }
            if (carry && i==this.longcount) throw new Error('This number MUST not be smaller than the number being subtracted');
            return this.setCount(this.shortcount);
        };

        N.prototype.subtractMultiple=function(number,digit) {
            var remainder=0;
            var modulus=0;
            for (var i = 0; i < this.longcount; i++) {
                remainder+=(number.longs[i] * digit);
                modulus=remainder%fullbase;
                remainder = Math.floor(remainder / fullbase);
                if (modulus>this.longs[i]) {
                    this.longs[i]+=(fullbase-modulus);
                    remainder++;
                }
                else this.longs[i]-=modulus;
            }
            return this.setCount(this.shortcount);
        };

        N.prototype.setCount=function(count) {
            this.shortcount=count;
            while (this.shortcount>0 && this.shorts[this.shortcount-1]==0) this.shortcount--;
            this.longcount=Math.ceil(this.shortcount/2);
            return this;
        };

        N.prototype.digitmultiply=function(multiplier,digit) {
            this.checkSize(1);
            for (var i=0; i<this.longcount; i++) {
                digit+=(this.longs[i]*multiplier);
                this.longs[i]=digit;
                digit=Math.floor(digit/fullbase);
            }
            if (digit) this.longs[i]=digit;
            return this.setCount((i+1)*2);
        };

        N.prototype.digitdivide=function(digit) {
            if (digit>=fullbase) throw new Error('Internal error - fast divisor greater than base');
            var i;
            var overflow=0;
            var temp;
            if (digit<halfbase) {
                for (i = this.longcount - 1; i >= 0; i--) {
                    temp = overflow * fullbase + this.longs[i];
                    this.longs[i] = Math.floor(temp / digit);
                    overflow = temp % digit;
                }
            } else {
                for (i = this.shortcount - 1; i >= 0; i--) {
                    temp = overflow * halfbase + this.shorts[i];
                    this.shorts[i] = Math.floor(temp / digit);
                    overflow = temp % digit;
                }
            }
            this.setCount(this.shortcount);
            return overflow;
        };

        N.prototype.accumulate=function(a,b,offset) {
            this.checkSize(b.longcount+1);
            for (var i=0; i<a.longcount; i++) {
                for (var j= 0,digit=0; j<b.longcount; j++) {
                    digit+=(a.longs[i] * b.shorts[j*2+offset]+this.longs[i+j]);
                    this.longs[i+j]=digit;
                    digit = Math.floor(digit / fullbase);
                }
                if (digit) this.longs[i+j]+=digit;
            }
            return this.setCount((i+j)*2);
        };

        N.prototype.reset=function() {
            for (var i=0; i<this.longcount; i++) this.longs[i]=0;
            this.sign=1;
            this.setCount(0);
        };

        N.prototype.set=function(n) {
            this.reset();
            this.sign=n<0 ? -1 : 1;
            n=Math.abs(n);
            for (var i=0; n!=0; i++) {
                if (i>0) this.checkSize(1);
                this.longs[i]=n;
                n=Math.floor(n/fullbase);
                this.longcount++;
            }
            return this.setCount(i*2);
        };

        N.prototype.random=function(digits) {
            var digitsPerElement = Math.log(fullbase) / Math.log(10);
            this.checkSize(Math.floor(digits/digitsPerElement)+1-this.size);
            for (var i=0; digits > digitsPerElement; i++) {
                this.longs[i]=Math.floor(Math.random() * fullbase);
                digits -= digitsPerElement;
            }
            this.longs[i]=(1+Math.floor(Math.random() * Math.pow(10, digits)));
            return this.setCount((i+1)*2);
        };

        N.prototype.multiply=function(number) {
            if (this.isZero()) return this;
            var operand=this.copy('temp');
            this.reset();
            this.sign=operand.sign*number.sign;
            return this.accumulate(operand,number,1).digitmultiply(halfbase,0).accumulate(operand,number,0);
        };

        N.prototype.halfshift=function(digit) {
            this.checkSize(1);
            for (var j = this.shortcount; j >= 0; j--) this.shorts[j + 1] = this.shorts[j];
            this.shorts[0] = digit;
            return this.setCount(this.shortcount+1);
        };

        N.prototype.fullshift=function(digit) {
            this.checkSize(1);
            for (var j = this.longcount; j >= 0; j--) this.longs[j + 1] = this.longs[j];
            this.longs[0] = digit;
            return this.setCount(this.shortcount+2);
        };

        N.prototype.divide=function(number) {
            if (number.isZero()) throw new Error('Attempt to divide by zero');
            var remainder=new N();
            if (!this.isZero()) {
                this.sign*=number.sign;
                switch (this.compare(number)) {
                case -1:
                    remainder = this.copy();
                    this.reset();
                    break;

                case 0:
                    this.set(1);
                    break;

                case 1:
                    if (number.longcount==1) remainder.set(this.digitdivide(number.longs[0]));
                    else {
                        for (var i = this.shortcount - 1; i >= 0; i--) {
                            remainder.halfshift(this.shorts[i]);
                            this.shorts[i]=0;
                            while (remainder.compare(number) >= 0) {
                                var difference = Math.max(1, (Math.floor((remainder.shorts[number.shortcount] * fullbase + remainder.shorts[number.shortcount - 1]*halfbase+remainder.shorts[number.shortcount - 2]) / (number.shorts[number.shortcount - 1]*halfbase+number.shorts[number.shortcount - 2] + 1))));
                                this.shorts[i] += difference;
                                remainder.subtractMultiple(number, difference);
                            }
                        }
                        this.setCount(this.shortcount);
                    }
                }
            }
            return remainder;
        };

        N.ZERO=new N();
        N.ONE=new N().set(1);
        N.TWO=new N().set(2);
        N.BASE=fullbase;

        N.Primes=(function() {
            var maxbuffer=Math.pow(2,24);   // in bytes - largest prime at 2^24 is 71,378,569 2 mins calculation time
            var primes;                     // cache of prime numbers

            function init() {
                primes = {
                    buffer: new Uint32Array(new ArrayBuffer(maxbuffer), 0),
                    count: 2,
                    limit: maxbuffer/4
                };
                primes.buffer[0] = 2;
                primes.buffer[1] = 3;
            }

            function Primes() {
                this.iterator=0;
            }

            Primes.prototype.next=function() {
                if (typeof primes=='undefined') init();
                if (this.iterator<primes.count) return primes.buffer[this.iterator++];
                if (primes.count==primes.limit) return 0; // run out of room, zero return indicates this
                var next=primes.buffer[primes.count-1];
                do {
                    next+=2;
                    var sqrt = Math.sqrt(next);
                    var prime=true;
                    for (var i = 0; i < primes.count && primes.buffer[i]<=sqrt; i++) {
                        if (next%primes.buffer[i]==0) {
                            prime = false;
                            break;
                        }
                    }
                } while (!prime);
                primes.buffer[primes.count++]=next;
                this.iterator++;
                return next;
            };

            return Primes;
        })();

        return N;
    })();

    // Aliases
    Tpa.minus=Tpa.subtract;
    Tpa.prototype.minus=Tpa.prototype.subtract;
    Tpa.times=Tpa.multiply;
    Tpa.prototype.times=Tpa.prototype.multiply;
    Tpa.div=Tpa.divide;
    Tpa.prototype.div=Tpa.prototype.divide;

    // CommonJS
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = Tpa;
    } else if (typeof define === 'function' && define.amd) {
        define(['Tpa'], Tpa);
    } else if (typeof window !== 'undefined') {
        window.Tpa = Tpa;
    }
})();
