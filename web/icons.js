const paths={
 compare:'<path d="M3 7h16m-4-4 4 4-4 4M21 17H5m4-4-4 4 4 4"/>',
 overview:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.8"/><path d="m16 16 4.5 4.5"/>',
 results:'<path d="M8 5h13M8 12h13M8 19h13M3 5h.1M3 12h.1M3 19h.1"/>',
 inspector:'<rect x="3" y="3" width="5" height="5" rx="1"/><rect x="16" y="3" width="5" height="5" rx="1"/><rect x="9" y="16" width="6" height="5" rx="1"/><path d="M5.5 8v4H18V8M12 12v4"/>',
 algorithms:'<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
 benchmarks:'<path d="M4 3v17h17M8 15v-4M13 15V6M18 15v-7"/>',
 docs:'<path d="M12 6c-2-2-5-2-9-2v15c4 0 7 0 9 2 2-2 5-2 9-2V4c-4 0-7 0-9 2v15"/>',
 pipeline:'<rect x="2" y="8" width="5" height="8" rx="1"/><rect x="17" y="8" width="5" height="8" rx="1"/><path d="M7 12h10"/>',
 dna:'<path d="M4 3c0 13 16 5 16 18M4 21c0-13 16-5 16-18M6 6h10M8 18h10M9 11l5 3"/>',
 file:'<path d="M4 5h6l2 3h8v11H4z"/>',run:'<path d="m7 4 13 8-13 8z"/>',
 code:'<path d="m7 7-5 5 5 5m10-10 5 5-5 5m-4-14-3 18"/>',
 arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>', book:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 3v18"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',check:'<path d="m3 12 6 6L21 6"/>',
 cpu:'<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/>',
 chev:'<path d="m9 5 7 7-7 7"/>',sliders:'<path d="M3 6h11m4 0h3M3 12h4m4 0h10M3 18h12m4 0h2"/><circle cx="16" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>'
};
export function icon(name,size=18){return '<svg aria-hidden="true" width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">'+(paths[name]||'')+'</svg>';}
