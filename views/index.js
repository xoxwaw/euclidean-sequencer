<!DOCTYPE html>
<html lang="en" dir="ltr">
    <head>
        <meta charset="utf-8">
        <title>Euclidian Sequencer</title>
        <link rel="stylesheet" type="text/css" href="css/main.css" />
        <link rel="stylesheet" type="text/css" href="css/switches.css" />

        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
        <script src="https://unpkg.com/@webcomponents/webcomponentsjs@^2/webcomponents-bundle.js"></script>
        <script src="https://unpkg.com/tone"></script>
        <script src="https://unpkg.com/@tonejs/ui"></script>

        <script type="text/javascript" src="../js/sound.js"></script>
        <script type="text/javascript" src="../js/arrange_radial.js"></script>
        <script type="text/javascript" src="../js/voice_display.js"></script>


    </head>
    <body>
      <div id="controls-container">
        <div id="controls">
          <h1><u>Euclidian Sequencer</u></h1>
          <h2>Ethan Rountree, Phi Nguyen, Porter Libby</h2>
          <div id='controlbtns'>
            <button id="general_btn" class='btn_control' type="button">General</button>
            <button id="v1_btn" class='btn_control' type="button" >Voice1</button>
            <button id="v2_btn" class='btn_control' type="button">Voice2</button>
            <button id="v3_btn" class='btn_control' type="button">Voice3</button>
          </div>
          <div id='general'>
            <label for="steps_num">STEPS PER MEASURE</label>
            <input type="range" id="step_val"class="slider" name="steps_num" min="0" max="16" value="1" step="1"
              oninput="populateAll()"
              onchange="populateAll()">

            <label for="tempo_num">TEMPO</label>
            <input type="range" class="slider" id = "tempo" name="tempo_num" min="0" max="16" value="1" step="1"
              oninput=""
              onchange="">
          </div>
          <div id="voice1">
            <h3>Voice 1</h3>
            <div class="onoffswitch">
              <input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="voice1switch"
                onchange="voiceToggle(this, 'circle1')" checked>
              <label class="onoffswitch-label" for="voice1switch">
                <span class="onoffswitch-inner"></span>
                <span class="onoffswitch-switch"></span>
              </label>
            </div>
            <label for="dot_num1">Pulses per measure</label>
            <input type="range" id="pulse_val_one" class="slider" name="dot_num1" min="0" max="16" value="1" step="1"
              oninput="populateAll()"
              onchange="populateAll()">
          </div>
          <div id="voice2">
            <h3>Voice 2</h3>
            <div class="onoffswitch">
              <input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="voice2switch"
                onchange="voiceToggle(this, 'circle2')" checked>
              <label class="onoffswitch-label" for="voice2switch">
                <span class="onoffswitch-inner"></span>
                <span class="onoffswitch-switch"></span>
              </label>
            </div>
            <label for="dot_num2">Pulses per measure</label>
            <input type="range" id="pulse_val_two" class="slider" name="dot_num2" min="0" max="16" value="1" step="1"
              oninput="populateAll()"
              onchange="populateAll()">
          </div>
          <div id="voice3">
            <h3>Voice 3</h3>
            <div class="onoffswitch">
              <input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="voice3switch"
                onchange="voiceToggle(this, 'circle3')" checked>
              <label class="onoffswitch-label" for="voice3switch">
                <span class="onoffswitch-inner"></span>
                <span class="onoffswitch-switch"></span>
              </label>
            </div>
            <label for="dot_num3">Pulses per measure</label>
            <input type="range" id="pulse_val_three" class="slider" name="dot_num3" min="0" max="16" value="1" step="1"
              oninput="populateAll()"
              onchange="populateAll()">
          </div>
        </div>
      </div>

      <div id='vis_container'>

        <div id="circle1">
          <div id="dot1" class="dot"></div>
        </div>

        <div id="circle2">
          <div id="dot2" class="dot"></div>
        </div>

        <div id="circle3">
          <div id="dot3" class="dot"></div>
        </div>
      </div>



      <script>
        arrange('circle1');
        arrange('circle2');
        arrange('circle3');
        $("#voice1").slideUp();
        $("#voice2").slideUp();
        $("#voice3").slideUp();
        $("#general").slideUp();

        $("#v1_btn").click(function(){ //toggle voice1
            $("#voice1").slideDown();
            $("#voice2").slideUp();
            $("#voice3").slideUp();
            $("#general").slideUp();
        });

        $("#v2_btn").click(function(){ //toggle voice1
            $("#voice1").slideUp();
            $("#voice2").slideDown();
            $("#voice3").slideUp();
            $("#general").slideUp();
        });

        $("#v3_btn").click(function(){ //toggle voice1
            $("#voice1").slideUp();
            $("#voice2").slideUp();
            $("#voice3").slideDown();
            $("#general").slideUp();
        });

        $("#general_btn").click(function(){ //toggle voice1
            $("#voice1").slideUp();
            $("#voice2").slideUp();
            $("#voice3").slideUp();
            $("#general").slideDown();
        });

      </script>
    </body>
</html>
