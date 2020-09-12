/* eslint-disable */
import simLauncher from '../../joist/js/simLauncher.js';
const mipmaps = [
  {
    "width": 72,
    "height": 507,
    "url": "data:image/png;base64,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"
  },
  {
    "width": 36,
    "height": 254,
    "url": "data:image/png;base64,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"
  },
  {
    "width": 18,
    "height": 127,
    "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAB/CAYAAADipJLTAAAAAklEQVR4AewaftIAAAbISURBVK3BO4xcVxnA8f/55pz7mJezdmbXsbCx1kEkkUKTwkFpIlFQQWiQKOloKOgoIVIkSioaIE14tEip06BIEYqxAk0QQkTxbiZsvM7aO3tn72Pm3o8ZsSvO7OydGY/m92uwxP2P/vbD777xvfyPf/j9IxawLFGW5csKW8A/WMCyRJ7ld0ZFEbCEZYmiKHrpaRqwhGWJPM9vFEURsIRliTzPrxVF0WAJYYGfvfnWa2VZdsbj8bM/f/MtywLCAga+xURVVTFwlwWExWL+L2IBYUOEDRE2RNgQYUOEDWlQ76cffviXn9y48Vz0/vt/5u3f/uYHwOvAO1xCqPdqGIbPOOdQVSYC4HlqCPVaYRhijMEYw5kdagj12s45RARPRA2h3nPOOYwxGGPwfIdLCPWMcw5jDCKC55tcQqj3nHMOYwwXCJcQ6gXOOYwxGGPwfI1LCJd7gwnnHMYYjDF4OlxCuNyrTFhrOT4+JssyoijiTJtLGCZ2dna+fXp6+qOiKF7odDq9IAie3dnZYXd3F1Vlf3+fjz/+mOFwyFS73c6SJDlot9v9sizfSdP015aJ4+PjX5Zl+WIURQwGA0ajEaPRiNFoxM2bNxERTk9PabfbVFVFkiRREAS38zy/3Wg0Xtve3i4tE41GAxEhSRKmrLXkec7du3e5ffs29+/fR1VJkoSpbrfLYDAgiiJEhMPDQxpM3Lx5859pmspECTSttVEQBNy6dYsgCPj888/Z39/HWou1FlWl2Wx+CtxL0/QXqvq2ZeKTTz55D3iP//n7aDT6RqvVotvtsrW1RavVoigKfGmavgwknBHmdZmw1mKMQVWp8QoeoYaIYIxhgdfxCPMMEyKCiLBAhEe4IIqiq1tbW7RaLdI0ZTAYkGUZIsJUt9vFGMOEwWOZ10mShDzPeffdd7HW8uTJE8IwREQ4OTkhiiKcc18fDAacs1zgnPtCVXeuX7/OSy+9RLfbZX9/n3v37jEcDmm32zQaDcIw/NdgMOBcA8+NGzd+nKbp97Msw1qLqpLnOf1+n8PDQ5xzlGWJqnJycnKqqr/jjMXT6XTSk5OTLI7jKI5jdnZ26PV6iAhTT548IU1TRIRer/fFBOcsni+//PL509PTqNvtIiLkeU6/3+fw8JC9vT3G4zHOORqNBnmev4LH4inL8nEQBBRFgaoSxzHdbpfhcEgQBDQaDVSVRqOBMQaf4HHO3RmNRgyHQ4IgIM9zkiShLEtUlamiKCjLkuFwiM/iSdO0Z63FOUe/3ydJEu7cuUOWZVhrqaoKay3GGFQ1LoqCc5ZZD621NJtNer0eu7u7hGGIc44kSdjb26PZbDIej4njOMJj8RhjdrMsI8syiqKg1WrR6XQ4ODhgf3+fZrOJMQbnHBPX8QizPmu32xhjuHLlCtvb22xvbxPHMa1WizAMGQ6HTI3H48/wWDxhGL766NEjrLUcHx/T7/ex1rK3t0eSJEwFQUCe51hrv4LH4jk5Oflrs9l8MY5jnHPcunWLq1evIiIMBgOKoiCKItI0JQzDJ2macs7iCcPwepqmFEVBs9nkwYMHPH78mMFgwFQQBBRFgXOOLMuewWOZ9cA5x3g85tq1a+zu7tLpdMjznCAISJIE5xzGGKy1D/BYPMfHx1/ljDGGra0tut0uzWaTJEmYGo1GjEYj4jj+Kh5hTVmWlXiEGqqKqlJHJ/AINVSVpyGs7wCPsD7FI8wqWJMwa8TqFI9QQ1VRVRZQPEKNqqpYQvEIs05YkzDrgDUJGyLMUs6oKqrKqoQaqsrTEGYpaxJmKWsSFlBVViVsiFBDVVlijEfYEGFDhPUd4BHWV+ARZuWcKcsSVWVVwqxTVqd4hPUpHmGWsDrFI8wqOFNVFarKlKqyjDDrT6xJqKGqPA1hlrImYVaOR1VZlTArY03CrMecqaqKpyEsoKpMqSrLCBsirK/EI9RQVZYo8QgbItQoy5Il/oNHWEBVWeAYj7Ahwryc1SgeYZ4yoaqoKgtUeIT1VXiEDRHmHXJGVVmVME+ZKMuSpyFsiDBPWYOwgKqyKmGesgZhQ4QaZVmiqqxK2BBhfRkeoUZVVSxh8Ag1yrJkiX/jERZQVRb4CI+wvgqPMK/ijKqyQIVHmJezmgyPMM+wmk/xCPOUM6rKqoR5R6xBmJexBqGGqnJOVVlGmKdMVFVFVVWsSpinrEHYEGFDhA0RFlBVViWsp+ICyyWstVy5coWHDx8iIhwdHXEuiiImqizL8FkuiOM4G4/HDIdDPvjgA6aMMUxZa8myjDiOx1xguaDX6/3q6OhorKovhGEYMyEiqCqqSrvd7ud5/g4X/Bdn2cixTDI6qQAAAABJRU5ErkJggg=="
  },
  {
    "width": 9,
    "height": 64,
    "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAABACAYAAADIxl20AAAAAklEQVR4AewaftIAAALWSURBVI3Bv2skZRjA8e/77My8u2GHXGRxiT8wEizUQg8rCztB4Tr/BG28zk6s9NDiKtvjCv8GC/+EQ2xEBLlOk+YMBEKCb3Kz2Xln5vEJM7DDsDfk82Hoya+/3WdAGLgM4RMGhIEQwvsMCD3fPvj+0+vr9WvfPfjhDXqEHod7BXQC7NEj3IJwCxN6qqr6crlcfvD48aP5ZQg/0xF6nj796+Pj43/499mzz+gReqbTaS4imB3gbTpCT5ZlcxGh8yEdYeOdLMtmIkLnTTrJcrl8K4RwP8/z9xaLBaenp3jvMfeccy8DPyUhhK9V9Yvz83MODw/x3qOqiMjduq7vpmn6ruzv7z8UkYfOuf/yPCfPc5qmoa5rvPePiqL4So6Ojv4uiuKbGKN678myjKqqiDFydXX1C/C70NnZ2UkxMUacc3jvMfuYhE7TNOnx8TFnZ2d47xER9szFxQWCOTg4uOecS0SE2WzGfD6naRqappljBBNC2BPjvaeua0IIqCrOudcxCUZVX40xcnl5SZIkJEmCqrJerycYwVRVlXrvyfOc2WxGlmU458iy7CWMYNI0zauqoqoq1us1ZVlS1zUxRsUIpizLYjKZcGM6nRJjREQQkQSTYOq6buq6ZrFYcOfOHZxzVFWFcy5iEsxqtdrBZFmG956yLLkRY5xihB5VZWCFEVoN2xUYoVViVJUBxQitiu0UI7ROGSG0FKOqbCO0lBFCj6qyjTCuxgjjrjFCq8GoKgMBI7QKtlOM0FKMqjKgGKH1hBFCq8KoKtsIreeMEForjKqyjTCuxgjjCozQo6oMnGGEjUpVGWgwwrgGI2w8V1W2EW5B2FDDNsItCD2qykCNEcYFjDDuD4yw0agqAxEjbDSqysAJRthY8QLCRqOqqCpDwobyAsItCD2qSo/SSeikaaonJycURYGIkKZps16vueHo7O7ufl6W5UeqOlFVvPd/hhB+xPwPX702YJvi388AAAAASUVORK5CYII="
  },
  {
    "width": 5,
    "height": 32,
    "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAgCAYAAADaDrJgAAAAAklEQVR4AewaftIAAAFESURBVF3BsYoTURiG4ff855CdJckQQUnAysYLECxFCwuvxZuQxRuxtbMTRWHvwRUrSwnJKiSSYYbJzPn8JbM46/Nw48PHTy8ZGO7VxeuH2+32OQPDBcKDrutKBgn39epqWZxNSgYJd3n5+UVV/X4E3AOuDTefz++YWQSe4mJRFG+Xy+WzGGOxXq8fTyaTzlJKb6bT6VlZlki6ruv6nR0Oh/dN08TdbkdKqQd+pNVq9aSqqsTJOc7qur6fcw45Z0II5zgDCjMjhICkhEt1XefFYsFsNqPrOv6ytm2jmRFj5Hg89jgDWkkMepwBvyQxZoD4j+EkMcg4A4780+IM+CmJgXAGfJfEmAGVJMaM21qc4SRlTnqc4UIILSOGk8SY4SQxyDjjRJw0OMNJ6hkxTjpJ3DBuEy7hNpvNl/1+f7coim9N0/AHzU6Kvb73Z+QAAAAASUVORK5CYII="
  }
];
mipmaps.forEach( mipmap => {
  mipmap.img = new Image();
  const unlock = simLauncher.createLock( mipmap.img );
  mipmap.img.onload = unlock;
  mipmap.img.src = mipmap.url; // trigger the loading of the image for its level
  mipmap.canvas = document.createElement( 'canvas' );
  mipmap.canvas.width = mipmap.width;
  mipmap.canvas.height = mipmap.height;
  const context = mipmap.canvas.getContext( '2d' );
  mipmap.updateCanvas = () => {
    if ( mipmap.img.complete && ( typeof mipmap.img.naturalWidth === 'undefined' || mipmap.img.naturalWidth > 0 ) ) {
      context.drawImage( mipmap.img, 0, 0 );
      delete mipmap.updateCanvas;
    }
  };
} );
export default mipmaps;