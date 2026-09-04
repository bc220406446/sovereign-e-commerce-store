"use client";
import { useEffect, useState } from "react";
export function useIsMobile() { const [mobile,setMobile]=useState(false); useEffect(()=>{const q=window.matchMedia("(max-width: 767px)");const update=()=>setMobile(q.matches);update();q.addEventListener("change",update);return()=>q.removeEventListener("change",update)},[]);return mobile; }
export default useIsMobile;
