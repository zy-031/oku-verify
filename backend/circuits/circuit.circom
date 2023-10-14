pragma circom 2.0.0; 


include "../node_modules/circomlib/circuits/comparators.circom";

template OkuLimit() {
    // private
    signal input oku; 

    // public
    signal input okuLimit;


    // true/false
    signal output out;

    component greaterThan = GreaterThan(8); 
    greaterThan.in[0] <== oku;
    greaterThan.in[1] <== okuLimit;

    out <-- greaterThan.out;
    out === 1;
}

component main {public [okuLimit]} = OkuLimit();
