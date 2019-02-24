/*
Arrange Radial Script

    > Arrange divs in a euclidian circle in parent

    2 / 3 / 19 : Initial commit + add templates
    2 / 4 / 19 : Fix null error
    2 / 12 / 19 : Add connections to backend and populate all function for general
    2 / 12 / 19 : rewrite the functions to clean up code space
*/
console.log("arrange_radial.js loaded");

var dot_template = [];
for (var i = 0; i < 3; i++){
    let template = document.createElement('div');
    template.setAttribute('class','dot');
    template.setAttribute('id', 'dot'+String(i+1));
    dot_template.push(template);
}

function populateAll(){  //change all three voices at the same time [ THIS IS THE ONE THAT SHOULD BE CALLED ON CHANGE ( FOR GENERAL )]
  var n = 1;
  if (document.getElementById("step_val") != null){
      n = document.getElementById("step_val").value;
  }
  updateSeq();
  for (var i = 1; i < 4; i++){
      populate(n, "circle"+ i, i);
  }
  pulses();
}

function populate(n,p,m){ // populate circle with n dots
  var parent = document.getElementById(p);
  if (parent){
    parent.innerHTML = '';
    for (var x = 0; x < n; x++){
      var cln = dot_template[m-1].cloneNode(true);
      parent.appendChild(cln);
    }
    arrange(p); // call to arrange after each time the number of dots changes
  }
}

function arrange(p){ // arrange dots with euclidian spacing
  var parent = document.getElementById(p);
  var children = parent.getElementsByTagName('div');
  var rad = parent.clientWidth / 2;
  var radial_dist = -360 / children.length;
  for (var x = 0; x < children.length; x++){
    var dist_degree = radial_dist * x;
    var dist_radian = dist_degree * (Math.PI / 180);
    var coord_x = Math.cos(dist_radian) * rad + rad - 15;
    var coord_y = Math.sin(dist_radian) * rad + rad - 15;
    children[x].style.bottom = coord_x+'px';
    children[x].style.right = coord_y+'px';
  }
}

function setPulses(id){//
    var circle_id = "circle" + String(id+1);
    var parent = document.getElementById(circle_id);
    var children = [];
    if (parent != null){
        children = parent.getElementsByTagName('div');
    }
    for (var x = 0; x < cycles[id].length;x++){
        if (children[x] != null){
            if (cycles[id][x] == 1){
                children[x].setAttribute('class', 'dot_pulse');
            }else{
                children[x].setAttribute('class', 'dot');
            }
        }
    }
}

function pulses(){
    for (var i = 0; i < 3; i++){
        setPulses(i);
    }
}

window.onload = function () { // once page is loaded, run initial populate
  populateAll(); // on load populate with current values.
}
