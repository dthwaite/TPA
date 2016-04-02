var Tpa=require("TPA");

// Create 3 new Tpa numbers
var n1=new Tpa('123 43/57');
var n2=new Tpa('-5.57[13]');
var n3=new Tpa(12.6);

// Multiply them together into a new Tpa starting at 1
var product=Tpa(1,false); // 'false' means NOT an integer - i.e. can hold fractional part
product.multiply(n1).multiply(n2).multiply(n3).simplify();

// et voila...
"["+product.toFraction()+"] * ["+n2.toFraction()+"] * ["+n3.toFraction()+"] equals ["+product.toFraction()+"] ("+product.toDecimal()+")";
