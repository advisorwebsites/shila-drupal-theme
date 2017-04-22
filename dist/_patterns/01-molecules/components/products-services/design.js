function writeCssVar(element, varName, value){
  return element.style.setProperty(`--${varName}`, value);
}
