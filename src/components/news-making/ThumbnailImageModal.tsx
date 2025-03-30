"use client";

import React, { useState, useEffect, useRef } from "react";
import ModalImageUploadSelfButton from "@/src/components/news-making/button/ModalImageUploadSelfButton";
import ModalImageUploadAiButton from "@/src/components/news-making/button/ModalImageUploadAiButton";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import apiClient from "@/src/utils/apiClient";

interface ThumbnailImageModalProps {
	isOpen: boolean;
	onClose: () => void;
	onImageUpload: (imageSrc: string) => void;
}

export default function ThumbnailImageModal({ isOpen, onClose, onImageUpload }: ThumbnailImageModalProps) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [fileName, setFileName] = useState<string>("");
	const [script, setScript] = useState<string>("");
	const fileInputRef = useRef<HTMLInputElement>(null);
	const searchParams = useSearchParams();
	const projectId = searchParams.get("projectId");

	useEffect(() => {
		const savedFileName = localStorage.getItem("selectedFileName");
		if (savedFileName) {
			setFileName(savedFileName);
		}
	}, []);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setSelectedFile(file);
			setFileName(file.name);
			localStorage.setItem("selectedFileName", file.name);

			const reader = new FileReader();
			reader.onloadend = () => {
				const imageSrc = reader.result as string;
				onImageUpload(imageSrc);
				onClose();
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSelfUpload = () => {
		fileInputRef.current?.click();
	};

	const handleAiGenerate = async () => {
		try {
			// 1. 섹션 ID 생성
			const sectionResponse = await apiClient.post(`/api/projects/${projectId}/sections`);
			const sectionId = sectionResponse.data.id;
			console.log('클라이언트 섹션 생성 🎯 섹션 ID:', sectionId);
			// 2. AI 이미지 생성
			const response = await apiClient.post(
				`/api/projects/${projectId}/sections/${sectionId}`,
				{ prompt: script },
				{
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
			console.log('클라이언트 AI 이미지 생성 🎯 이미지 URL:', response.data.imageUrl);
			// 3. 생성된 이미지 URL을 썸네일 카드에 적용
			if (response.data.imageUrl) {
				onImageUpload(response.data.imageUrl);
				onClose();
			}
		} catch (error) {
			console.error("AI 이미지 생성 실패:", error);
			alert("이미지 생성에 실패했습니다. 다시 시도해주세요.");
		}
	};

	const handleClose = () => {
		onClose();
	};

	const handleModalClick = (e: React.MouseEvent) => {
		e.stopPropagation();
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 flex items-center justify-center z-50">
			<div className="absolute inset-0 bg-black opacity-40" onClick={handleClose}></div>
			<div 
				className="flex flex-col items-center justify-center gap-[25px] relative bg-white w-[600px] h-[600px] pr-[30px] pl-[30px] rounded-lg shadow-lg text-center"
				onClick={handleModalClick}
			>
				<h2 className="font-bold font-bold-24 text-2xl">이미지 업로드</h2>
				<p className="text-gray-500">이미지를 업로드하세요.</p>

				<div className="w-full relative">
					<div className="absolute inset-0 pointer-events-none flex items-center pl-[120px]">
					</div>
					<input
						type="file"
						accept="image/*"
						onChange={handleFileChange}
						ref={fileInputRef}
						className={`block w-full text-sm text-gray-500
							file:mr-4 file:py-2 file:px-4
							file:rounded-full file:border-0
							file:text-sm file:font-semibold
							file:bg-purple-50 file:text-purple-700
							hover:file:bg-purple-100`}
					/>
				</div>
				<ModalImageUploadSelfButton onClick={handleSelfUpload}></ModalImageUploadSelfButton>
								{/* 스크립트 입력 영역 */}
								<div className="w-full">
					<textarea
						value={script}
						onChange={(e) => setScript(e.target.value)}
						placeholder="생성할 썸네일에 대한 스크립트를 입력해주세요"
						className="w-full h-[100px] p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
					/>
				</div>
				<ModalImageUploadAiButton onClick={handleAiGenerate} />
				<button className="mt-4 px-4 py-2 bg-gray-300 rounded" onClick={handleClose}>
					닫기
				</button>
			</div>
		</div>
	);
}
