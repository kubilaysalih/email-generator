import { useRef, useState, useEffect } from 'react';
import ColorPicker from 'editorjs-color-picker';

/* eslint-disable @typescript-eslint/no-explicit-any */
const Editor = () => {
  const editorRef = useRef<any>(null);
  const [editorReady, setEditorReady] = useState(false);

  useEffect(() => {
    // Bu kısım sadece client tarafında çalışacak
    const initEditor = async () => {
      try {
        // EditorJS ve gerekli araçları dinamik olarak yükle
        const EditorJS = (await import('@editorjs/editorjs')).default;
        const Header = (await import('@editorjs/header')).default;
        const List = (await import('@editorjs/list')).default;
        const DragDrop = (await import('editorjs-drag-drop')).default;
        const Undo = (await import('editorjs-undo')).default;
        const Checklist = (await import('@editorjs/checklist')).default;
        const AlignmentTune = (await import('editor-js-alignment-tune')).default;
        const Table = (await import('@editorjs/table')).default;
        const ImageTool = (await import('@editorjs/image')).default;
        const Paragraph = (await import('@editorjs/paragraph')).default;
        const Embed = (await import('@editorjs/embed')).default;
        const Quote = (await import('@editorjs/quote')).default;
        const Marker = (await import('@editorjs/marker')).default;
        const InlineCode = (await import('@editorjs/inline-code')).default;

        if (!editorRef.current) {
          // EditorJS örneğini oluştur
          editorRef.current = new EditorJS({
            holder: 'editorjs',
            onReady: () => {
              new Undo({ editor: editorRef.current });
              new DragDrop(editorRef.current);
            },
            autofocus: true,
            placeholder: 'Notlarınızı buraya yazabilirsiniz...',
            // Inline toolbar'a renk aracı eklendi
            inlineToolbar: ['bold', 'italic', 'link', 'ColorPicker'],
            tools: {
              alignmentTune: {
                class: AlignmentTune
              },
              // Basit renk seçici aracı
              ColorPicker: {
                class: ColorPicker,
              },
              header: {
                class: Header,
                inlineToolbar: true,
                config: {
                  levels: [1, 2, 3],
                  defaultLevel: 1
                }
              },
              paragraph: {
                class: Paragraph,
                inlineToolbar: true,
                tunes: ['alignmentTune']

              },

              list: {
                class: List,
                inlineToolbar: true,
                config: {
                  defaultStyle: 'unordered'
                }
              },
              checklist: {
                class: Checklist,
                inlineToolbar: true
              },
              table: {
                class: Table,
                inlineToolbar: true,
                config: {
                  rows: 2,
                  cols: 3,
                }
              },
              image: {
                class: ImageTool,
                config: {
                  // Gerçek uygulamada burada dosya yükleme için bir endpoint olmalı
                  // Şimdilik demo için basit bir URL dönüş fonksiyonu kullanıyoruz
                  uploader: {
                    uploadByFile(file: File) {
                      // URL.createObjectURL ile geçici bir URL oluştur
                      // Gerçek uygulamada burada backend'e dosya yükleme yapılmalı
                      return new Promise(resolve => {
                        const url = URL.createObjectURL(file);
                        resolve({
                          success: 1,
                          file: {
                            url: url
                          }
                        });
                      });
                    },
                    uploadByUrl(url: string) {
                      return Promise.resolve({
                        success: 1,
                        file: {
                          url: url
                        }
                      });
                    }
                  }
                }
              },
              quote: {
                class: Quote,
                inlineToolbar: true
              },
              embed: {
                class: Embed,
                inlineToolbar: true,
                config: {
                  services: {
                    youtube: true,
                    twitter: true,
                    instagram: true
                  }
                }
              },
              marker: {
                class: Marker,
                shortcut: 'CMD+SHIFT+M'
              },
              inlineCode: {
                class: InlineCode,
                shortcut: 'CMD+SHIFT+C'
              }
            },
            // Basit bir başlangıç yapısı
            data: {
              time: Date.now(),
              blocks: [
                {
                  type: 'header',
                  data: {
                    text: 'Editor.js Örneği',
                    level: 1
                  }
                },
                {
                  type: 'paragraph',
                  data: {
                    text: 'Bu bir blok-stili editördür. Yukarıdaki araç çubuğunu kullanarak farklı bloklar ekleyebilirsiniz.'
                  }
                },
                {
                  type: 'paragraph',
                  data: {
                    text: 'Metni seçip <span style="color: #FF5733;">renkli metinler</span> oluşturabilirsiniz. Renk seçici ile istediğiniz rengi seçebilirsiniz.'
                  }
                },
                {
                  type: 'list',
                  data: {
                    style: 'unordered',
                    items: [
                      'Başlıklar ekleyin',
                      'Resimler yükleyin',
                      'Listeler oluşturun',
                      'Tablolar ekleyin',
                      'Şimdi renkler de kullanın!'
                    ]
                  }
                }
              ]
            }
          });

          setEditorReady(true);
        }
      } catch (err) {
        console.error('Editor başlatılamadı:', err);
      }
    };

    // init fonksiyonunu çalıştır
    initEditor();

    // Component unmount olduğunda editor örneğini temizle
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  return (
    <div className="mt-8 border rounded-lg shadow-md p-6 bg-white">
      <h2 className="text-xl font-semibold mb-4">Blok Editör</h2>
      <p className="text-gray-600 mb-4">
        Editor.js ile gelişmiş içerik oluşturun. Resimler, tablolar, listeler ve <span style={{color: '#FF5733'}}>renkli metinler</span> ekleyebilirsiniz.
      </p>

      {/* EditorJS container */}
      <div id="editorjs" className="border rounded-lg p-4 min-h-[400px]"></div>

      {/* Kullanım talimatları */}
      <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg">
        <p className="text-sm"><strong>İpucu:</strong> Metni seçtiğinizde açılan araç çubuğunda renk simgesine tıklayarak renk seçebilirsiniz.</p>
      </div>

      {/* Kaydetme butonları */}
      <div className="mt-4 flex justify-end gap-2">
        <button
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
          disabled={!editorReady}
          onClick={async () => {
            if (editorRef.current) {
              const savedData = await editorRef.current.save();
              console.log('Editor Verisi:', savedData);
              alert('JSON verisi konsolda görüntüleniyor. F12 tuşuna basarak kontrol edebilirsiniz.');
            }
          }}
        >
          JSON Göster
        </button>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          disabled={!editorReady}
          onClick={async () => {
            if (editorRef.current) {
              const savedData = await editorRef.current.save();
              // localStorage veya backend'e kaydetme kodu
              console.log('Kaydedilen içerik:', savedData);
              alert('İçerik kaydedildi!');
            }
          }}
        >
          Kaydet
        </button>
      </div>
    </div>
  );
};

export default Editor;