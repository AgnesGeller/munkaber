(function(){
  "use strict";
  const KEY="diszkertek-munkaber-belepes",TRUSTED="diszkertek-munkaber-megbizhato-eszkoz",form=document.getElementById("loginForm"),status=document.getElementById("loginStatus"),pinLabel=document.getElementById("pinLabel");
  function unlock(name){document.getElementById("loginView").hidden=true;document.getElementById("appShell").hidden=false;document.querySelector(".brand span").textContent=`Munkabér · ${name}`}
  form.addEventListener("submit",event=>{event.preventDefault();const name=form.elements.manager.value,trusted=localStorage.getItem(TRUSTED)==="igen";if(!["Tamás","Ági"].includes(name)||(!trusted&&form.elements.pin.value!=="0909")){status.textContent="Hibás név vagy PIN-kód.";return}if(form.elements.remember.checked){localStorage.setItem(KEY,name);localStorage.setItem(TRUSTED,"igen")}else sessionStorage.setItem(KEY,name);unlock(name)});
  document.getElementById("logoutButton").addEventListener("click",()=>{localStorage.removeItem(KEY);sessionStorage.removeItem(KEY);document.getElementById("appShell").hidden=true;document.getElementById("loginView").hidden=false;form.reset();pinLabel.hidden=localStorage.getItem(TRUSTED)==="igen";form.elements.pin.required=!pinLabel.hidden;form.elements.remember.checked=true;status.textContent="Válaszd ki, ki használja most az alkalmazást."});
  document.getElementById("refreshButton").addEventListener("click",async()=>{status.textContent="";if("serviceWorker" in navigator){const registration=await navigator.serviceWorker.getRegistration();if(registration)await registration.update()}location.reload()});
  let installPrompt;
  addEventListener("beforeinstallprompt",event=>{event.preventDefault();installPrompt=event});
  document.getElementById("installButton").addEventListener("click",async()=>{if(installPrompt){installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;return}alert("A böngésző menüjében válaszd a „Telepítés” vagy a „Hozzáadás a kezdőképernyőhöz” lehetőséget.")});
  const saved=localStorage.getItem(KEY)||sessionStorage.getItem(KEY);if(["Tamás","Ági"].includes(saved))unlock(saved);
}());
