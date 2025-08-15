import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Eye, Edit2, Upload, Image } from "lucide-react";
import { Link } from "wouter";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { SiteContent } from "@shared/content-schema";

interface ContentItem {
  id: string;
  key: string;
  title: string;
  content: string;
}

export default function ContentManager() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const response = await fetch('/api/content');
      if (response.ok) {
        const data = await response.json();
        
        // Custom ordering for better content organization
        const fieldOrder = [
          'hero_title',
          'hero_description', 
          'hero_image',
          'event_title',
          'event_date',
          'event_time',
          'event_details',
          'early_bird_price',
          'regular_price',
          'payment_image',
          'venue_name',
          'venue_address',
          'google_maps_url',
          'contact_email',
          'contact_phone',
          'benefits_content',
          'brought_to_you_by'
        ];
        
        const sortedData = data.sort((a: ContentItem, b: ContentItem) => {
          const aIndex = fieldOrder.indexOf(a.key);
          const bIndex = fieldOrder.indexOf(b.key);
          // Put unknown fields at the end
          if (aIndex === -1 && bIndex === -1) return a.key.localeCompare(b.key);
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });
        
        setContent(sortedData);
      }
    } catch (error) {
      console.error('Failed to load content:', error);
      toast({
        title: "Error",
        description: "Failed to load website content",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveContent = async (id: string, newContent: string) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/content/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newContent }),
      });

      if (response.ok) {
        setContent(prev => prev.map(item => 
          item.id === id ? { ...item, content: newContent } : item
        ));
        setEditingId(null);
        setEditingContent("");
        toast({
          title: "Success",
          description: "Content updated successfully",
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Failed to save content:', error);
      toast({
        title: "Error", 
        description: "Failed to save content",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (itemId: string) => {
    return {
      method: "PUT" as const,
      url: await getImageUploadURL(),
    };
  };

  const getImageUploadURL = async (): Promise<string> => {
    const response = await fetch('/api/content/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    return data.uploadURL;
  };

  const handleImageUploadComplete = async (itemId: string, result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      // Extract the object path from the upload URL
      const url = new URL(uploadedFile.uploadURL);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.findIndex(part => part.includes('replit-objstore'));
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        const objectPath = '/' + pathParts.slice(bucketIndex).join('/');
        const publicPath = `/public-objects/${pathParts.slice(bucketIndex + 2).join('/')}`;
        
        // Update the content with the new image path
        await saveContent(itemId, publicPath);
        
        toast({
          title: "Success",
          description: "Image uploaded successfully",
        });
      }
    }
    setUploadingImage(null);
  };

  const isImageContent = (key: string) => {
    return key === 'hero_image' || key === 'payment_image';
  };

  const startEditing = (item: ContentItem) => {
    setEditingId(item.id);
    setEditingContent(item.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingContent("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Loading content...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Website Content Manager</h1>
            <p className="text-gray-600 mt-2">Edit website content without code changes</p>
          </div>
          <div className="flex gap-3">
            <a 
              href="/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Website
            </a>
            <Link href="/admin">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft size={16} />
                Back to Admin
              </Button>
            </Link>
          </div>
        </div>

        {/* Content Cards */}
        <div className="space-y-6">
          {content.map((item) => (
            <Card key={item.id} className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    {editingId === item.id ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => saveContent(item.id, editingContent)}
                          disabled={isSaving}
                          className="flex items-center gap-1"
                        >
                          <Save size={14} />
                          {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditing}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        {isImageContent(item.key) && (
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={5242880} // 5MB for images
                            onGetUploadParameters={() => handleImageUpload(item.id)}
                            onComplete={(result) => handleImageUploadComplete(item.id, result)}
                            buttonClassName="h-8 px-3 text-xs mr-2"
                          >
                            <Upload size={12} className="mr-1" />
                            Upload Image
                          </ObjectUploader>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditing(item)}
                          className="flex items-center gap-1"
                        >
                          <Edit2 size={14} />
                          Edit
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {editingId === item.id ? (
                  <div className="space-y-3">
                    {item.content.length > 100 ? (
                      <Textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        rows={4}
                        className="w-full"
                        placeholder="Enter content..."
                      />
                    ) : (
                      <Input
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="w-full"
                        placeholder="Enter content..."
                      />
                    )}
                    <div className="text-sm text-gray-500">
                      Key: <code className="bg-gray-100 px-2 py-1 rounded">{item.key}</code>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      {isImageContent(item.key) ? (
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600">Current image path: <code className="bg-gray-200 px-2 py-1 rounded text-xs">{item.content}</code></p>
                          {item.content && (
                            <div className="border rounded-lg overflow-hidden bg-white max-w-md">
                              <img 
                                src={item.content.startsWith('/objects/') 
                                  ? item.content 
                                  : item.content.startsWith('/') 
                                    ? item.content 
                                    : item.content} 
                                alt={item.title}
                                className="w-full h-auto max-h-48 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const errorDiv = document.createElement('div');
                                  errorDiv.className = 'p-4 text-center text-gray-500 text-sm bg-gray-100 rounded';
                                  errorDiv.textContent = 'Image not found - upload a new image';
                                  target.parentNode?.appendChild(errorDiv);
                                }}
                                onLoad={(e) => {
                                  // Remove any error messages if image loads successfully
                                  const target = e.target as HTMLImageElement;
                                  const parent = target.parentNode as HTMLElement;
                                  const errorDiv = parent.querySelector('div');
                                  if (errorDiv && errorDiv.textContent?.includes('Image not found')) {
                                    errorDiv.remove();
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div 
                          className="text-gray-800"
                          dangerouslySetInnerHTML={{ __html: item.content }}
                        />
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      Key: <code className="bg-gray-100 px-2 py-1 rounded">{item.key}</code>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Box */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Eye className="text-blue-600 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">How Content Management Works</h3>
                <ul className="text-blue-800 space-y-1 text-sm">
                  <li>• Changes appear immediately on the live website</li>
                  <li>• HTML tags like &lt;br /&gt; work for line breaks</li>
                  <li>• Upload new images using the "Upload Image" button</li>
                  <li>• All content is automatically saved to the database</li>
                  <li>• No code deployment needed for content changes</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}