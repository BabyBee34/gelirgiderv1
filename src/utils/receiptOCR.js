// FinanceFlow - Receipt Scanner OCR Integration
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

class ReceiptOCRManager {
  constructor() {
    this.supportedFormats = ['image/jpeg', 'image/png', 'image/heic'];
    this.maxImageSize = 10 * 1024 * 1024; // 10MB
    this.imageQuality = 0.8;
  }

  // Kamera izni iste
  async requestCameraPermission() {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Kamera izni hatası:', error);
      return false;
    }
  }

  // Galeri izni iste
  async requestGalleryPermission() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Galeri izni hatası:', error);
      return false;
    }
  }

  // Kamera ile fotoğraf çek
  async takePhoto() {
    try {
      const hasPermission = await this.requestCameraPermission();
      if (!hasPermission) {
        throw new Error('Kamera izni verilmedi');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: this.imageQuality,
        base64: false
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const image = result.assets[0];
        return await this.processImage(image);
      }

      return null;
    } catch (error) {
      console.error('Fotoğraf çekme hatası:', error);
      throw error;
    }
  }

  // Galeriden fotoğraf seç
  async pickFromGallery() {
    try {
      const hasPermission = await this.requestGalleryPermission();
      if (!hasPermission) {
        throw new Error('Galeri izni verilmedi');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: this.imageQuality,
        base64: false
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const image = result.assets[0];
        return await this.processImage(image);
      }

      return null;
    } catch (error) {
      console.error('Galeri seçim hatası:', error);
      throw error;
    }
  }

  // Görüntüyü işle
  async processImage(image) {
    try {
      // Görüntü boyutunu kontrol et
      if (image.fileSize && image.fileSize > this.maxImageSize) {
        throw new Error('Görüntü boyutu çok büyük (max: 10MB)');
      }

      // Görüntü formatını kontrol et
      if (!this.supportedFormats.includes(image.type)) {
        throw new Error('Desteklenmeyen görüntü formatı');
      }

      // Görüntüyü optimize et
      const optimizedImage = await this.optimizeImage(image.uri);
      
      // OCR işlemi başlat
      const ocrResult = await this.performOCR(optimizedImage);
      
      return {
        originalImage: image,
        optimizedImage,
        ocrResult,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Görüntü işleme hatası:', error);
      throw error;
    }
  }

  // Görüntüyü optimize et
  async optimizeImage(imageUri) {
    try {
      const optimizedImage = await manipulateAsync(
        imageUri,
        [
          { resize: { width: 1024 } }, // Genişliği 1024'e sınırla
          { brightness: 1.1 }, // Parlaklığı artır
          { contrast: 1.2 } // Kontrastı artır
        ],
        {
          compress: this.imageQuality,
          format: SaveFormat.JPEG
        }
      );

      return optimizedImage;
    } catch (error) {
      console.error('Görüntü optimizasyon hatası:', error);
      return { uri: imageUri }; // Optimizasyon başarısız olursa orijinali döndür
    }
  }

  // OCR işlemi yap (mock implementation - gerçek OCR service ile değiştirilecek)
  async performOCR(imageUri) {
    try {
      // Bu kısım gerçek OCR service ile değiştirilecek
      // Örnek: Google Cloud Vision, Tesseract.js, vb.
      
      // Mock OCR result
      const mockOCRResult = await this.mockOCRProcessing(imageUri);
      
      return {
        success: true,
        text: mockOCRResult.text,
        confidence: mockOCRResult.confidence,
        items: mockOCRResult.items,
        totalAmount: mockOCRResult.totalAmount,
        merchantName: mockOCRResult.merchantName,
        date: mockOCRResult.date,
        taxAmount: mockOCRResult.taxAmount
      };
    } catch (error) {
      console.error('OCR işlemi hatası:', error);
      throw error;
    }
  }

  // Mock OCR processing (gerçek OCR ile değiştirilecek)
  async mockOCRProcessing(imageUri) {
    // Simüle edilmiş OCR işlemi
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock data
    const mockData = {
      text: 'MARKET XYZ\nTarih: 15.08.2024\n\nEkmek 5.00 TL\nSüt 12.50 TL\nYoğurt 8.75 TL\n\nKDV: 2.63 TL\nTOPLAM: 28.88 TL',
      confidence: 0.85,
      items: [
        { name: 'Ekmek', price: 5.00, quantity: 1 },
        { name: 'Süt', price: 12.50, quantity: 1 },
        { name: 'Yoğurt', price: 8.75, quantity: 1 }
      ],
      totalAmount: 28.88,
      merchantName: 'MARKET XYZ',
      date: '2024-08-15',
      taxAmount: 2.63
    };

    return mockData;
  }

  // OCR sonucunu parse et
  parseOCRResult(ocrResult) {
    try {
      if (!ocrResult.success || !ocrResult.text) {
        throw new Error('OCR sonucu geçersiz');
      }

      const parsedData = {
        merchantName: ocrResult.merchantName || this.extractMerchantName(ocrResult.text),
        date: ocrResult.date || this.extractDate(ocrResult.text),
        totalAmount: ocrResult.totalAmount || this.extractTotalAmount(ocrResult.text),
        taxAmount: ocrResult.taxAmount || this.extractTaxAmount(ocrResult.text),
        items: ocrResult.items || this.extractItems(ocrResult.text),
        rawText: ocrResult.text,
        confidence: ocrResult.confidence
      };

      return {
        success: true,
        data: parsedData
      };
    } catch (error) {
      console.error('OCR sonuç parse hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Merchant adını çıkar
  extractMerchantName(text) {
    const lines = text.split('\n');
    // İlk satır genellikle merchant adıdır
    return lines[0]?.trim() || 'Bilinmeyen';
  }

  // Tarihi çıkar
  extractDate(text) {
    const dateRegex = /(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/;
    const match = text.match(dateRegex);
    
    if (match) {
      const [, day, month, year] = match;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return new Date().toISOString().split('T')[0];
  }

  // Toplam tutarı çıkar
  extractTotalAmount(text) {
    const totalRegex = /TOPLAM[:\s]*([0-9]+[.,]?[0-9]*)/i;
    const match = text.match(totalRegex);
    
    if (match) {
      return parseFloat(match[1].replace(',', '.'));
    }
    
    // Alternatif regex'ler
    const altRegex = /([0-9]+[.,]?[0-9]*)\s*TL\s*$/m;
    const altMatch = text.match(altRegex);
    
    if (altMatch) {
      return parseFloat(altMatch[1].replace(',', '.'));
    }
    
    return 0;
  }

  // KDV tutarını çıkar
  extractTaxAmount(text) {
    const taxRegex = /KDV[:\s]*([0-9]+[.,]?[0-9]*)/i;
    const match = text.match(taxRegex);
    
    if (match) {
      return parseFloat(match[1].replace(',', '.'));
    }
    
    return 0;
  }

  // Ürünleri çıkar
  extractItems(text) {
    const lines = text.split('\n');
    const items = [];
    
    for (const line of lines) {
      // Fiyat içeren satırları bul
      const priceRegex = /([^0-9]+)\s+([0-9]+[.,]?[0-9]*)\s*TL/i;
      const match = line.match(priceRegex);
      
      if (match) {
        const [, name, price] = match;
        items.push({
          name: name.trim(),
          price: parseFloat(price.replace(',', '.')),
          quantity: 1
        });
      }
    }
    
    return items;
  }

  // OCR sonucunu doğrula
  validateOCRResult(parsedData) {
    const errors = [];
    
    if (!parsedData.merchantName || parsedData.merchantName === 'Bilinmeyen') {
      errors.push('Merchant adı tespit edilemedi');
    }
    
    if (!parsedData.totalAmount || parsedData.totalAmount <= 0) {
      errors.push('Toplam tutar tespit edilemedi');
    }
    
    if (!parsedData.date) {
      errors.push('Tarih tespit edilemedi');
    }
    
    if (parsedData.items.length === 0) {
      errors.push('Ürün listesi tespit edilemedi');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      confidence: parsedData.confidence || 0
    };
  }

  // OCR sonucunu düzenle
  editOCRResult(parsedData, edits) {
    try {
      const editedData = { ...parsedData };
      
      if (edits.merchantName) {
        editedData.merchantName = edits.merchantName;
      }
      
      if (edits.date) {
        editedData.date = edits.date;
      }
      
      if (edits.totalAmount) {
        editedData.totalAmount = edits.totalAmount;
      }
      
      if (edits.taxAmount) {
        editedData.taxAmount = edits.taxAmount;
      }
      
      if (edits.items) {
        editedData.items = edits.items;
      }
      
      return {
        success: true,
        data: editedData
      };
    } catch (error) {
      console.error('OCR sonuç düzenleme hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // OCR sonucunu transaction'a dönüştür
  convertToTransaction(parsedData, userId, accountId, categoryId) {
    try {
      const transaction = {
        user_id: userId,
        account_id: accountId,
        category_id: categoryId,
        amount: parsedData.totalAmount,
        type: 'expense',
        description: `${parsedData.merchantName} - Fiş`,
        date: parsedData.date,
        notes: `OCR ile taranan fiş\nMerchant: ${parsedData.merchantName}\nKDV: ${parsedData.taxAmount} TL`,
        receipt_url: null, // Görüntü URL'i buraya eklenebilir
        tags: ['receipt', 'ocr'],
        created_at: new Date().toISOString()
      };

      return {
        success: true,
        transaction
      };
    } catch (error) {
      console.error('Transaction dönüştürme hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Singleton instance
const receiptOCRManager = new ReceiptOCRManager();

export default receiptOCRManager;
