const SUPABASE_URL = "https://moaapgvuvvgwsvloiril.supabase.co";
const SUPABASE_KEY = "sb_publishable_Q0idxR5yVgTSIcDEu8ISVg_ixdZAGVj";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const girisBolumu = document.getElementById("giris-bolumu");
const yonetimBolumu = document.getElementById("yonetim-bolumu");
const mesaj = document.getElementById("mesaj");
const urunMesaj = document.getElementById("urun-mesaj");
const kategoriMesaj = document.getElementById("kategori-mesaj");

async function yetkiKontrol() {
    const { data: { session } } =
        await supabaseClient.auth.getSession();

    if (!session) {
        girisBolumu.hidden = false;
        yonetimBolumu.hidden = true;
        return;
    }

    const { data, error } =
        await supabaseClient.rpc("is_admin");

    if (error || data !== true) {
        await supabaseClient.auth.signOut();
        girisBolumu.hidden = false;
        yonetimBolumu.hidden = true;
        mesaj.textContent = "Yönetici yetkiniz bulunmuyor.";
        return;
    }

    girisBolumu.hidden = true;
    yonetimBolumu.hidden = false;

    await kategorileriGetir();
    await urunleriGetir();
}

document.getElementById("giris-formu")
    .addEventListener("submit", async function(event) {
        event.preventDefault();

        const email = document.getElementById("eposta").value;
        const password = document.getElementById("sifre").value;

        mesaj.textContent = "Giriş kontrol ediliyor...";

        const { error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) {
            mesaj.textContent = "Giriş başarısız: " + error.message;
            return;
        }

        await yetkiKontrol();
    });

async function kategorileriGetir() {
    const { data, error } = await supabaseClient
        .from("kategoriler")
        .select("*")
        .order("sira");

    if (error) {
        urunMesaj.textContent = error.message;
        return;
    }

    const secim = document.getElementById("kategori");
    secim.innerHTML = "";

    data.forEach(kategori => {
        const secenek = document.createElement("option");
        secenek.value = kategori.id;
        secenek.textContent = kategori.ad;
        secim.appendChild(secenek);
    });
}

document.getElementById("kategori-formu")
    .addEventListener("submit", async function(event) {
        event.preventDefault();

        const ad = document.getElementById("kategori-adi").value.trim();

        if (!ad) {
            kategoriMesaj.textContent = "Kategori adı girin.";
            return;
        }

        kategoriMesaj.textContent = "Kategori ekleniyor...";

        const { error } = await supabaseClient
            .from("kategoriler")
            .insert({ ad: ad });

        if (error) {
            kategoriMesaj.textContent = "Hata: " + error.message;
            return;
        }

        kategoriMesaj.textContent = "Kategori eklendi!";
        this.reset();

        await kategorileriGetir();
    });

async function urunleriGetir() {
    const liste = document.getElementById("urun-listesi");
    liste.textContent = "Ürünler yükleniyor...";

    const { data, error } = await supabaseClient
        .from("urunler")
        .select("*")
        .order("sira");

    if (error) {
        liste.textContent = error.message;
        return;
    }

    const { data: kategoriler } = await supabaseClient
        .from("kategoriler")
        .select("*");

    liste.innerHTML = "";

    data.forEach(urun => {
        const alan = document.createElement("div");

        const kategori = kategoriler.find(
            k => k.id === urun.kategori_id
        );

        const bilgi = document.createElement("p");
        bilgi.textContent =
            (kategori ? kategori.ad : "") + " - " +
            urun.ad + " - " + urun.fiyat + " TL" +
            (urun.mevcut ? " (Satışta)" : " (Satışta değil)");

        const fiyatButonu = document.createElement("button");
        fiyatButonu.textContent = "Fiyatı Değiştir";

        fiyatButonu.onclick = async function() {
            const yeniFiyat = prompt("Yeni fiyatı girin:", urun.fiyat);

            if (yeniFiyat === null || yeniFiyat.trim() === "") return;

            const fiyat = Number(yeniFiyat);

            if (!Number.isFinite(fiyat) || fiyat < 0) {
                alert("Geçerli bir fiyat girin.");
                return;
            }

            const { error } = await supabaseClient
                .from("urunler")
                .update({ fiyat: fiyat })
                .eq("id", urun.id);

            if (error) {
                alert("Hata: " + error.message);
            } else {
                await urunleriGetir();
            }
        };

        const durumButonu = document.createElement("button");
        durumButonu.textContent =
            urun.mevcut ? "Satıştan Kaldır" : "Satışa Aç";

        durumButonu.onclick = async function() {
            const { error } = await supabaseClient
                .from("urunler")
                .update({ mevcut: !urun.mevcut })
                .eq("id", urun.id);

            if (error) {
                alert("Hata: " + error.message);
            } else {
                await urunleriGetir();
            }
        };

        const silButonu = document.createElement("button");
        silButonu.textContent = "Sil";

        silButonu.onclick = async function() {
            if (!confirm(urun.ad + " silinsin mi?")) return;

            const { error } = await supabaseClient
                .from("urunler")
                .delete()
                .eq("id", urun.id);

            if (error) {
                alert("Hata: " + error.message);
            } else {
                await urunleriGetir();
            }
        };

        alan.appendChild(bilgi);
        alan.appendChild(fiyatButonu);
        alan.appendChild(durumButonu);
        alan.appendChild(silButonu);

        liste.appendChild(alan);
    });
}

document.getElementById("urun-formu")
    .addEventListener("submit", async function(event) {
        event.preventDefault();

        const kategori_id =
            Number(document.getElementById("kategori").value);

        const ad =
            document.getElementById("urun-adi").value;

        const fiyat =
            Number(document.getElementById("urun-fiyat").value);

        const { error } = await supabaseClient
            .from("urunler")
            .insert({
                kategori_id: kategori_id,
                ad: ad,
                fiyat: fiyat,
                mevcut: true
            });

        if (error) {
            urunMesaj.textContent = "Hata: " + error.message;
            return;
        }

        urunMesaj.textContent = "Ürün eklendi!";
        this.reset();

        await urunleriGetir();
    });

document.getElementById("cikis-yap")
    .addEventListener("click", async function() {
        await supabaseClient.auth.signOut();
        location.reload();
    });

yetkiKontrol();
