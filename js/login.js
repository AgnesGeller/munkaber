(function(){
  "use strict";
  const KEY="diszkertek-munkaber-belepes",form=document.getElementById("loginForm"),status=document.getElementById("loginStatus");
  function unlock(name){document.getElementById("loginView").hidden=true;document.getElementById("appShell").hidden=false;document.querySelector(".brand span").textContent=`Munkabér · ${name}`}
  form.addEventListener("submit",event=>{event.preventDefault();const name=form.elements.manager.value;if(!["Tamás","Ági"].includes(name)||form.elements.pin.value!=="0909"){status.textContent="Hibás név vagy PIN-kód.";return}if(form.elements.remember.checked)localStorage.setItem(KEY,name);else sessionStorage.setItem(KEY,name);unlock(name)});
  document.getElementById("logoutButton").addEventListener("click",()=>{localStorage.removeItem(KEY);sessionStorage.removeItem(KEY);location.reload()});
  const saved=localStorage.getItem(KEY)||sessionStorage.getItem(KEY);if(["Tamás","Ági"].includes(saved))unlock(saved);
}());
