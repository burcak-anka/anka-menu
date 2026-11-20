
const SUPABASE_URL = "https://moaapgvuvvgwsvloiril.supabase.co";

// Buraya kendi Publishable key bilgini ekle.
const SUPABASE_KEY = "sb_publishable_Q0idxR5yVgTSIcDEu8ISVg_ixdZAGVj";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


async function menuGetir() {
    const menuContainer = document.getElementById("menu-container");

    menuContainer.textContent = "Menümüz yükleniyor...";

    // Kategorileri getir
    const { data: kategoriler, error: kategoriHatasi } =
        await supabaseClient
            .from("kategoriler")
            .select("*")
            .order("sira");

    if (kategoriHatasi) {
    menuContainer.textContent =
        "Hata: " + kategoriHatasi.message;

    console.error(kategoriHatasi);
    return;
    }

    // Ürünleri getir
    const { data: urunler, error: urunHatasi } =
        await supabaseClient
            .from("urunler")
            .select("*")
            .eq("mevcut", true)
            .order("sira");

    if (urunHatasi) {
        menuContainer.textContent = "Ürünler yüklenemedi.";
        console.error(urunHatasi);
        return;
    }

    // Kategorileri ekrana yazdır
    menuContainer.innerHTML = "";

    kategoriler.forEach(kategori => {
        const kategoriBolumu = document.createElement("section");

        const baslik = document.createElement("h2");
        baslik.textContent = kategori.ad;

        kategoriBolumu.appendChild(baslik);

        // Kategoriye ait ürünleri bul
        const kategoriUrunleri = urunler.filter(
            urun => urun.kategori_id === kategori.id
        );

        kategoriUrunleri.forEach(urun => {
            const urunAlani = document.createElement("div");

            const urunAdi = document.createElement("h3");
            urunAdi.textContent = urun.ad;

            const fiyat = document.createElement("p");
            fiyat.textContent = Number(urun.fiyat).toFixed(2) + " TL";

            urunAlani.appendChild(urunAdi);
            urunAlani.appendChild(fiyat);

            kategoriBolumu.appendChild(urunAlani);
        });

        menuContainer.appendChild(kategoriBolumu);
    });
}

menuGetir();
