var NOTES = new Array("C","C#","D","D#","E","F","F#","G","G#","A","A#","B");
var NOTES_SHARP = new Array("C","C#","D","D#","E","F","F#","G","G#","A","A#","B");
var NOTES_FLAT = new Array("C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B");
var OPEN_STR = new Array(4, 11, 7, 2, 9, 4);
var BASS_FREQ = {C:65.41,"C#":69.30,Db:69.30,D:73.42,"D#":77.78,Eb:77.78,E:82.41,F:87.31,"F#":92.50,Gb:92.50,G:98.00,"G#":103.83,Ab:103.83,A:110.00,"A#":116.54,Bb:116.54,B:123.47};

var KEYS = {
  C:{idx:0,flat:false}, Db:{idx:1,flat:true}, D:{idx:2,flat:false}, Eb:{idx:3,flat:true},
  E:{idx:4,flat:false}, F:{idx:5,flat:true}, Gb:{idx:6,flat:true}, G:{idx:7,flat:false},
  Ab:{idx:8,flat:true}, A:{idx:9,flat:false}, Bb:{idx:10,flat:true}, B:{idx:11,flat:false}
};

var MODES = {
  ionian:      {label:'Majeur (Ionien)',       intervals:new Array(0,2,4,5,7,9,11), chords:new Array('maj7','m7','m7','maj7','7','m7','m7b5')},
  aeolian:     {label:'Mineur (Éolien)',       intervals:new Array(0,2,3,5,7,8,10), chords:new Array('m7','m7b5','maj7','m7','m7','maj7','7')},
  dorian:      {label:'Dorien (Mineur Jazz)',  intervals:new Array(0,2,3,5,7,9,10), chords:new Array('m7','m7','maj7','7','m7','m7b5','maj7')},
  mixolydian:  {label:'Mixolydien (Blues/Funk)',intervals:new Array(0,2,4,5,7,9,10),chords:new Array('7','m7','m7b5','maj7','m7','m7','maj7')},
  lydian:      {label:'Lydien (Prog/Math)',    intervals:new Array(0,2,4,6,7,9,11), chords:new Array('maj7','7','m7','m7b5','maj7','m7','m7')},
  harmonic_min:{label:'Mineur Harmonique',     intervals:new Array(0,2,3,5,7,8,11), chords:new Array('mMaj7','m7b5','maj7#5','m7','7','maj7','dim7')},
  phrygian_dom:{label:'Phrygien Dominant',     intervals:new Array(0,1,4,5,7,8,10), chords:new Array('7','maj7','m7b5','m7','dim7','maj7#5','m7')},
  blues:       {label:'Blues Mineur',          intervals:new Array(0,3,5,6,7,10),   chords:new Array('7','7','7','7','7','7','7')}
};

var GUITARS = {
  strat:    {name:'Fender Stratocaster', shift:3, tip:'Strat : Triades CAGED (+3 cases), double-stops et cocottes funk.'},
  lespaul:  {name:'Gibson Les Paul',     shift:7, tip:'Les Paul : Positions hautes (+7 cases), sustain, bends larges et octaves.'},
  acoustic: {name:'Acoustique Folk',     shift:0, tip:'Acoustique : Accords ouverts, cordes à vide, picking Travis et harmoniques.'},
  nylon:    {name:'Guitare Nylon',       shift:0, tip:'Nylon : Voicings bossa enrichis aux doigts et phrasé flamenco.'}
};

var PATS = {
  emmanuel:  {name:'Tommy Emmanuel (Fingerstyle)', mode:'mixolydian', deg:new Array(1,4,5,1), bpm:104, guitar:'acoustic', groove:'jazz'},
  asato:     {name:'Mateus Asato (Neo-Soul)',      mode:'ionian',     deg:new Array(4,5,3,6), bpm:78,  guitar:'strat',    groove:'funk'},
  igusa:     {name:'Seiji Igusa (Percussive)',     mode:'ionian',     deg:new Array(1,5,6,4), bpm:92,  guitar:'acoustic', groove:'bossa'},
  ichika:    {name:'Ichika Nito (Math-Rock)',      mode:'lydian',     deg:new Array(1,2,3,5), bpm:110, guitar:'strat',    groove:'rock'},
  bonamassa: {name:'Joe Bonamassa (Blues-Rock)',   mode:'blues',      deg:new Array(1,1,4,1,5,4,1,5), bpm:72, guitar:'lespaul', groove:'blues'},
  mayer:     {name:'John Mayer (Pop-Blues)',       mode:'ionian',     deg:new Array(1,6,4,5), bpm:84,  guitar:'strat',    groove:'blues'},
  knopfler:  {name:'Mark Knopfler (Finger Rock)',  mode:'dorian',     deg:new Array(1,7,6,7), bpm:100, guitar:'strat',    groove:'rock'},
  nichols:   {name:'Jared J. Nichols (Southern)',  mode:'blues',      deg:new Array(1,4,1,5), bpm:88,  guitar:'lespaul',  groove:'rock'},
  mancuso:   {name:'Matteo Mancuso (Fusion)',      mode:'dorian',     deg:new Array(1,4,7,3), bpm:112, guitar:'lespaul',  groove:'jazz'},
  wong:      {name:'Cory Wong (Funk Cocotte)',     mode:'mixolydian', deg:new Array(1,4,1,4), bpm:112, guitar:'strat',    groove:'funk'},
  hendrix:   {name:'Hendrix / SRV (Blues R&B)',    mode:'blues',      deg:new Array(1,4,5,4), bpm:82,  guitar:'strat',    groove:'blues'},
  sheeran:   {name:'Ed Sheeran (Pop Percussive)',  mode:'ionian',     deg:new Array(1,5,6,4), bpm:92,  guitar:'acoustic', groove:'rock'},
  misch:     {name:'Tom Misch (Chill Neo-Soul)',   mode:'dorian',     deg:new Array(2,5,1,6), bpm:90,  guitar:'strat',    groove:'funk'},
  henson:    {name:'Tim Henson (Trap-Prog)',       mode:'harmonic_min',deg:new Array(1,6,4,5),bpm:118, guitar:'nylon',    groove:'funk'},
  mason:     {name:'Brent Mason (Chicken Pickin)', mode:'mixolydian', deg:new Array(1,4,5,1), bpm:120, guitar:'strat',    groove:'jazz'},
  gilberto:  {name:'João Gilberto (Bossa Nova)',   mode:'ionian',     deg:new Array(1,2,5,1), bpm:116, guitar:'nylon',    groove:'bossa'},
  page:      {name:'Jimmy Page (Classic Rock)',    mode:'mixolydian', deg:new Array(1,7,4,1), bpm:92,  guitar:'lespaul',  groove:'rock'},
  gilmour:   {name:'David Gilmour (Melodic Bends)',mode:'aeolian',    deg:new Array(1,4,1,5), bpm:66,  guitar:'strat',    groove:'rock'},
  reinhardt: {name:'Django Reinhardt (Manouche)',  mode:'harmonic_min',deg:new Array(1,6,2,5),bpm:132, guitar:'acoustic', groove:'jazz'},
  montgomery:{name:'Wes Montgomery (Jazz Octaves)',mode:'dorian',     deg:new Array(2,5,1,6), bpm:106, guitar:'lespaul',  groove:'jazz'},
  mayfield:  {name:'Curtis Mayfield (Soul R&B)',   mode:'ionian',     deg:new Array(1,3,4,5), bpm:84,  guitar:'strat',    groove:'funk'},
  marley:    {name:'Bob Marley (Reggae Skank)',    mode:'aeolian',    deg:new Array(1,4,6,5), bpm:76,  guitar:'lespaul',  groove:'reggae'},
  malmsteen: {name:'Yngwie Malmsteen (Néoclass.)', mode:'harmonic_min',deg:new Array(1,4,5,1),bpm:126, guitar:'strat',    groove:'rock'},
  frusciante:{name:'John Frusciante (Funk-Rock)',  mode:'aeolian',    deg:new Array(1,5,6,4), bpm:90,  guitar:'strat',    groove:'funk'},
  bensusan:  {name:'Pierre Bensusan (Celtic)',     mode:'dorian',     deg:new Array(1,7,4,1), bpm:94,  guitar:'acoustic', groove:'bossa'},
  gibbons:   {name:'Billy Gibbons (Texas Boogie)', mode:'blues',      deg:new Array(1,4,5,1), bpm:108, guitar:'lespaul',  groove:'blues'},
  sharkey:   {name:'Isaiah Sharkey (Gospel R&B)',  mode:'ionian',     deg:new Array(1,3,6,2,5,1), bpm:74, guitar:'strat', groove:'funk'},
  buckley:   {name:'Jeff Buckley (Alt-Folk)',      mode:'aeolian',    deg:new Array(1,6,4,5), bpm:70,  guitar:'strat',    groove:'rock'},
  petrucci:  {name:'John Petrucci (Prog Metal)',   mode:'phrygian_dom',deg:new Array(1,2,7,1),bpm:120, guitar:'lespaul',  groove:'rock'},
  pacolucia: {name:'Paco de Lucía (Flamenco)',     mode:'phrygian_dom',deg:new Array(1,2,3,2),bpm:122, guitar:'nylon',    groove:'bossa'},
  moore:     {name:'Gary Moore (Slow Blues)',      mode:'aeolian',    deg:new Array(1,6,4,5), bpm:62,  guitar:'lespaul',  groove:'blues'},
  trucks:    {name:'Derek Trucks (Slide Soul)',    mode:'mixolydian', deg:new Array(1,4,1,5), bpm:80,  guitar:'lespaul',  groove:'blues'}
};
