'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const YANDEX_METRIKA_ID = 98093904;

export default function YandexMetrika() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    (function(m,e,t,r,i,k,a){
      m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();
      for (var j = 0; j < document.scripts.length; j++) {
        if (document.scripts[j].src === r) { return; }
      }
      k=e.createElement(t),a=e.getElementsByTagName(t)[0];
      k.async=1;k.src=r;a.parentNode.insertBefore(k,a)
    })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

    window.ym(YANDEX_METRIKA_ID, "init", {
      defer: true,
      clickmap:true,
      trackLinks:true,
      accurateTrackBounce:true,
      webvisor:true
    });

    window.ym(YANDEX_METRIKA_ID, 'hit', `${pathname}?${searchParams}`);
  }, [pathname, searchParams])

  return (
    <noscript>
      <div>
        <img src={`https://mc.yandex.ru/watch/${YANDEX_METRIKA_ID}`} style={{ position: 'absolute', left: '-9999px' }} alt="" />
      </div>
    </noscript>
  )
}
