json_template = '/json/timeline-plandemie.json'
var options = {
  language: "de",
  width: "100%",
  height: "100%",
  initial_zoom: 3,
  slide_padding_lr: 100,
  hash_bookmark: false,
  start_at_end: true,
}
window.timeline = new TL.Timeline('timeline-embed', json_template, options);