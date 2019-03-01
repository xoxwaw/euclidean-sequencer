/*
Arrange Radial Script

    > Arrange divs in a euclidian circle in parent

    2 / 3 / 19 : Initial commit + add templates
    2 / 4 / 19 : Fix null error
    2 / 12 / 19 : Add connections to backend and populate all function for general
    2 / 12 / 19 : rewrite the functions to clean up code space
*/
console.log("arrange_radial.js loaded");

var dot_template = []; //initialization of all the dots

for (var i = 0; i < global.num_cycle; i++) {
    /*
    update all the dots at the load
    */
    let template = document.createElement('div');
    template.setAttribute('class', 'dot');
    template.setAttribute('id', 'dot' + String(i + 1));
    dot_template.push(template);
}

function populateAll() { //change all three voices at the same time [ THIS IS THE ONE THAT SHOULD BE CALLED ON CHANGE ( FOR GENERAL )]
    /*
    populate the dots in each circle on change
    */
    var n = 1; //default value of 1.
    if (document.getElementById("step_val") != null) {
        n = document.getElementById("step_val").value;
    } //get value of the step
    updateSeq(); //update the music
    for (var i = 1; i < global.num_cycle + 1; i++) {
        populate(n, "circle" + i, i);
    }
    pulses(); //update the visual pulses
}

function populate(n, p, m) {
    /*
    populate each circle with n dots
    */
    var parent = document.getElementById(p); //get circle id components
    if (parent) {
        parent.innerHTML = '';
        for (var x = 0; x < n; x++) {
            var cln = dot_template[m - 1].cloneNode(true);
            parent.appendChild(cln);
        }
        arrange(p); // update the circles
    }
}

function arrange(p) {
    /*
    arrange dots with euclidian spacing
    */
    var parent = document.getElementById(p); //get circle id components
    var children = parent.getElementsByTagName('div'); //get all the divs circle component
    var rad = parent.clientWidth / 2; //radian value
    var radial_dist = -360 / children.length;
    for (var x = 0; x < children.length; x++) {
        var dist_degree = radial_dist * x;
        var dist_radian = dist_degree * (Math.PI / 180);
        var coord_x = Math.cos(dist_radian) * rad + rad - 15;
        var coord_y = Math.sin(dist_radian) * rad + rad - 15;
        children[x].style.bottom = coord_x + 'px';
        children[x].style.right = coord_y + 'px';
    }
}

function setPulses(id) {
    /*
    set the pulse in each circle id component
    */
    var circle_id = "circle" + String(id + 1);
    var parent = document.getElementById(circle_id);
    var children = [];
    if (parent != null) {
        children = parent.getElementsByTagName('div');
    }
    for (var x = 0; x < cycles[id].length; x++) {
        if (children[x] != null) {
            if (cycles[id][x] == 1) {
                children[x].setAttribute('class', 'dot_pulse'); //add active style to the dot
            } else {
                children[x].setAttribute('class', 'dot'); //add inactive style to the dot
            }
        }
    }
}

function pulses() {
    for (var i = 0; i < cycles.length; i++) {
        setPulses(i);
    }
}

window.onload = function() { // once page is loaded, run initial populate
    populateAll(); // on load populate with current values.
}