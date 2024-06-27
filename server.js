const mysql = require("mysql");
const express = require("express");
const bodyParser = require("body-parser");
const path = require('path');
const app = express();
app.use(express.static(path.join(__dirname, 'web_proje', 'web_sitesi', 'public')));
app.use(bodyParser.json()); // JSON parse etmek için eklendi
app.use(bodyParser.urlencoded({ extended: true }));
const enCoder = bodyParser.urlencoded({ extended: true });

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "mustafa6167",
    database: "site_veritabani"
});

connection.connect(function (error) {
    if (error) {
        throw error;
    } else {
        console.log("Bağlantı başarıyla kuruldu!");
    }
});

app.get("/anasayfa", function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

app.get("/ogretmen", function (req, res) {
    res.sendFile(__dirname + "/basarili_ogretmen.html");
});

app.get("/kayit", function (req, res) {
    res.sendFile(__dirname + "/ogrenci_kaydi.html");
});

app.get("/sinavDuzenle", function (req, res) {
    res.sendFile(__dirname + "/sinav.html");
});

app.get('/bilgilerim', (req, res) => {
    connection.query('SELECT ad, soyad, numara FROM ogrenci WHERE is_active = true', (error, results, fields) => {
        if (error) throw error;
        res.json(results);
    });
});

app.get('/sinavBilgi', (req, res) => {
    connection.query('SELECT mat_not, fiz_not, kim_not, tar_not, cog_not, fel_not FROM ogrenci WHERE is_active = true', (error, results, fields) => {
        if (error) throw error;
        res.json(results);
    });
});

app.get('/bilgilerim_ogretmen', (req, res) => {
    connection.query('SELECT ad, soyad, kullanici_adi FROM ogretmen WHERE is_active = true', (error, results, fields) => {
        if (error) throw error;
        res.json(results);
    });
});

app.get('/ogrenci_bilgi', (req, res) => {
    connection.query('SELECT ad, soyad, numara FROM ogrenci', (error, results, fields) => {
        if (error) throw error;
        res.json(results);
    });
});



app.post("/login_student", enCoder, function (req, res) {
    var numara = req.body.studentNumber;
    var sifre = req.body.studentPassword;
    connection.query("SELECT * FROM ogrenci WHERE numara = ? AND sifre = ?", [numara, sifre], function (error, results, fields) {
        if (error) {
            throw error;
        }
        if (results.length > 0) {
            var ogrenci_id = results[0].ogrenci_id; // Giriş yapan kullanıcının uye_id'sini al
            // Kullanıcının sadece kendi uye_id'sine sahip olduğu sütunu TRUE olarak güncelle
            connection.query("UPDATE ogrenci SET is_active = TRUE WHERE ogrenci_id = ?", [ogrenci_id], function (updateError, updateResults, updateFields) {
                if (updateError) {
                    throw updateError;
                }
                res.sendFile(__dirname + "/basarili_ogrenci.html");
            });
        } else {
            res.send("Giriş başarısız! E-posta veya şifre yanlış.");
        }
    });
});

app.post("/login_teacher", enCoder, function (req, res) {
    var numara = req.body.teacherUsername;
    var sifre = req.body.teacherPassword;
    connection.query("SELECT * FROM ogretmen WHERE kullanici_adi = ? AND sifre = ?", [numara, sifre], function (error, results, fields) {
        if (error) {
            throw error;
        }
        if (results.length > 0) {
            var ogretmen_id = results[0].ogretmen_id; // Giriş yapan kullanıcının uye_id'sini al
            // Kullanıcının sadece kendi uye_id'sine sahip olduğu sütunu TRUE olarak güncelle
            connection.query("UPDATE ogretmen SET is_active = TRUE WHERE ogretmen_id = ?", [ogretmen_id], function (updateError, updateResults, updateFields) {
                if (updateError) {
                    throw updateError;
                }
                res.sendFile(__dirname + "/basarili_ogretmen.html");
            });
        } else {
            res.send("Giriş başarısız! E-posta veya şifre yanlış.");
        }
    });
});

app.post("/ogrenci_kaydi", enCoder, function (req, res) {
    var ad = req.body.fname;
    var soyad = req.body.lname;
    var numara = req.body.telefon;
    var sifre = req.body.şifre;

    connection.query(
        "INSERT INTO ogrenci (ad, soyad, numara, sifre, mat_not, fiz_not, kim_not, tar_not, cog_not,fel_not) VALUES (?, ?, ?, ?, 0, 0, 0, 0, 0, 0)",
        [ad, soyad, numara, sifre],
        function (error, results, fields) {
            if (error) {
                throw error;
            }
            res.sendFile(__dirname + "/basarili_ogretmen.html");
        }
    );
});

app.post("/cikis_ogretmen", function (req, res) {
    // Aktif olan öğretmeni pasif hale getirme işlemi
    connection.query("UPDATE ogretmen SET is_active = FALSE WHERE is_active = TRUE", function (error, results, fields) {
        if (error) {
            throw error;
        }
        res.status(200).json({ message: "Çıkış yapıldı" });
    });
});

app.post("/cikis_ogrenci", function (req, res) {
    // Aktif olan öğrenciyi pasif hale getirme işlemi
    connection.query("UPDATE ogrenci SET is_active = FALSE WHERE is_active = TRUE", function (error, results, fields) {
        if (error) {
            throw error;
        }
        res.status(200).json({ message: "Çıkış yapıldı" });
    });
});

app.post("/sifre_degistir", function (req, res) {
    var numara = req.body.numara;
    var yeniSifre = req.body.yeniSifre;

    // Önce mevcut kullanıcının is_active değeri true olan olduğundan emin olunmalı
    connection.query("SELECT * FROM ogrenci WHERE numara = ? AND is_active = TRUE", [numara], function (error, results, fields) {
        if (error) {
            throw error;
        }

        if (results.length > 0) {
            // Kullanıcı bulundu, şifre güncelleme işlemi yapılabilir
            connection.query("UPDATE ogrenci SET sifre = ? , is_active=FALSE WHERE numara = ?", [yeniSifre, numara], function (updateError, updateResults, updateFields) {
                if (updateError) {
                    throw updateError;
                }
                res.sendStatus(200); // Başarılı yanıt gönder
            });
        } else {
            // Kullanıcı bulunamadı veya is_active değeri false ise hata mesajı gönder
            res.status(404).send("Kullanıcı bulunamadı veya aktif değil.");
        }
    });
});

app.post("/sifre_degistir_ogretmen", function (req, res) {
    var kullaniciAdi = req.body.kullaniciAdi;
    var yeniSifre = req.body.yeniSifre;

    // Önce mevcut kullanıcının is_active değeri true olan olduğundan emin olunmalı
    connection.query("SELECT * FROM ogretmen WHERE kullanici_adi = ? AND is_active = TRUE", [kullaniciAdi], function (error, results, fields) {
        if (error) {
            throw error;
        }

        if (results.length > 0) {
            // Kullanıcı bulundu, şifre güncelleme işlemi yapılabilir
            connection.query("UPDATE ogretmen SET sifre = ? , is_active=FALSE WHERE kullanici_adi = ?", [yeniSifre, kullaniciAdi], function (updateError, updateResults, updateFields) {
                if (updateError) {
                    throw updateError;
                }
                res.sendStatus(200); // Başarılı yanıt gönder
            });
        } else {
            // Kullanıcı bulunamadı veya is_active değeri false ise hata mesajı gönder
            res.status(404).send("Kullanıcı bulunamadı veya aktif değil.");
        }
    });
});

app.post('/updateExam', (req, res) => {
    const { sinavAdi, soruSayisi, sure, sinavLink, cevapAnahtari } = req.body;

    const query = `
      INSERT INTO sinav (sinav_adi, sure, soru_sayisi, sinav_link, cevap_anahtari)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE sure = VALUES(sure), soru_sayisi = VALUES(soru_sayisi), sinav_link = VALUES(sinav_link), cevap_anahtari = VALUES(cevap_anahtari)
    `;

    connection.query(query, [sinavAdi, sure, soruSayisi, sinavLink, cevapAnahtari], (err, results) => {
        if (err) {
            console.error('Error inserting/updating exam data:', err);
            res.status(500).json({ message: 'Veritabanı hatası' });
        } else {
            res.status(200).json({ message: 'Sınav bilgileri başarıyla kaydedildi' });
        }
    });
});

app.get('/getPdfLink', (req, res) => {
    const sinavAdi = req.query.sinavAdi;

    const query = 'SELECT sinav_link, sure, soru_sayisi FROM sinav WHERE sinav_adi = ?';

    connection.query(query, [sinavAdi], (err, results) => {
        if (err) {
            console.error('Error fetching exam data:', err);
            res.status(500).json({ message: 'Veritabanı hatası' });
        } else if (results.length > 0) {
            res.status(200).json({
                link: results[0].sinav_link,
                sure: results[0].sure,
                soru_sayisi: results[0].soru_sayisi
            });
        } else {
            res.status(404).json({ message: 'Sınav bilgileri bulunamadı' });
        }
    });
});

app.post('/saveAnswers', (req, res) => {
    const { sinavAdi, answers } = req.body;

    const query = `UPDATE ogrenci SET ${sinavAdi} = ? WHERE is_active = TRUE`;

    connection.query(query, [answers], (err, results) => {
        if (err) {
            console.error('Error updating answers:', err);
            res.status(500).json({ message: 'Veritabanı hatası' });
        } else {
            res.status(200).json({ message: 'Cevaplar kaydedildi' });
        }
    });
});


app.get('/ogrenciler', (req, res) => {
    connection.query('SELECT * FROM ogrenci', (error, results, fields) => {
        if (error) throw error;
        res.json(results);
    });
});



// Öğrenci notlarını güncelleyen route
app.post('/update-notlar', (req, res) => {
    const { ogrenci_id, mat_not, fiz_not, kim_not, tar_not, cog_not, fel_not } = req.body;
    const query = 'UPDATE ogrenci SET mat_not = ?, fiz_not = ?, kim_not = ?, tar_not = ?, cog_not = ?, fel_not = ? WHERE ogrenci_id = ?';
    connection.query(query, [mat_not, fiz_not, kim_not, tar_not, cog_not, fel_not, ogrenci_id], (error, results, fields) => {
        if (error) throw error;
        res.send('Notlar güncellendi!');
    });
});
app.get('/ogrenci-cevaplari', (req, res) => {
    connection.query('SELECT ogrenci_id, ad, soyad, numara, Matematik, Fizik, Kimya, Tarih, Cografya, Felsefe FROM ogrenci', (error, results, fields) => {
        if (error) throw error;
        res.json(results);
    });
});









app.listen(5500, function () {
    console.log("Sunucu 5500 portunda çalışıyor.");
});
