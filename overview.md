# Overview — cluster-canvas-workspace

## 1) Mục tiêu sản phẩm
Một **infinite canvas workspace** cho các tác vụ dạng “AI/terminal workspace”/design-tooling: pan/zoom mượt và tổ chức công việc theo các **node** trên canvas.

## 2) Tech stack chính
- **Frontend**: Vite + React 19
- **Canvas engine**: React Flow
- **State management**: Zustand
- **UI/animation**: Framer Motion
- **Icons**: lucide-react
- **Backend-ready**: Supabase JS (có client, nhưng chưa thấy phần persist/load được tích hợp đầy đủ)

## 3) Kiến trúc thư mục (tối giản)
- `src/App.jsx`: Layout tổng thể (Navbar/Sidebar/Canvas/Properties + modals)
- `src/features/canvas/CanvasContainer.jsx`: Bọc ReactFlowProvider, render ReactFlow + background/minimap/controls
- `src/features/canvas/BaseNode.jsx`: Khung node dùng chung (header, resize, lock, xóa, mở Properties)
- `src/features/nodes/*`: Implement các node custom
  - `TodoNode`, `NotesNode`, `WebsiteNode`, `DrawNode`, `GroupNode`
- `src/components/layout/*`: `Navbar`, `Sidebar`, `PropertiesPanel`
- `src/components/ui/*`: modal và overlay (ví dụ GridOverlay)
- `src/store/*`: Zustand store (theme + workspace)
- `src/api/supabaseClient.js`: cấu hình Supabase
- `src/features/canvas/hooks/useCanvasLogic.js`: helper tạo node (hiện có dấu hiệu chưa được tích hợp nhất quán)

## 4) Luồng hoạt động chính
1. `main.jsx` render `App`
2. `App.jsx` gọi `useThemeStore.init()` để set CSS variables
3. `CanvasContainer.jsx` render ReactFlow với `nodes` lấy từ `useWorkspaceStore`
4. Khi user thao tác (add/delete/duplicate/group/select/resize), logic cập nhật qua Zustand
5. `PropertiesPanel` hiển thị khi `selectedNodeId` thay đổi
6. Modals (Theme/Shortcuts/Settings) hiển thị theo `activeModal`

## 5) Các tính năng hiện có
- Pan/zoom canvas; Background grid dots; MiniMap; Fit view/Zoom controls
- Node custom: **notes/todo/website/draw/group**
- CRUD theo node: thêm, xóa, duplicate
- Selection + Properties panel: chỉnh title, opacity, outline/background, size, lock/unlock, z-index
- Group node: có frame group và logic parentNode (theo hướng React Flow)
- Grid Mode: có overlay hiển thị card preview theo selected nodes
- Theme: nhiều preset (Nordic dark + các theme khác)

## 6) Các hạng mục còn cần làm (chưa hoàn chỉnh)
- **Persist dữ liệu**: hiện các workspace/nodes chủ yếu in-memory trong Zustand; cần lưu/load (LocalStorage trước, sau đó Supabase)
- **Grid Mode thực sự**: hiện mới là overlay preview, chưa có reflow/tiled layout đúng nghĩa
- **Đồng bộ internal state của node**: một số node có state local (vd `WebsiteNode`) có thể không sync khi `data` thay đổi từ bên ngoài
- **Persist Draw**: vẽ chưa serialize vào `data` để khôi phục
- **Group UX/selection & ràng buộc**: cần đảm bảo resize/move parent có ảnh hưởng ổn định lên child
- **Edges/connectivity**: hiện `edges=[]` và `nodesConnectable=false` (nếu muốn mô phỏng graph/terminal AI flow cần bật connect)
- **SettingsModal**: UI tồn tại nhưng các setting chưa được nối tới logic canvas (snapToGrid/allowOverlap/showMinimap/showGrid/animations...)

## 7) Gợi ý roadmap (tham khảo)
- MVP: LocalStorage persist + export/import
- Tiếp theo: sync state của node + persist draw
- Sau đó: Grid Mode reflow + settings->canvas behavior
- Nâng cấp: edges/connect + mô hình graph rõ ràng

## 8) License
MIT

