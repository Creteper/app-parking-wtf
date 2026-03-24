import React, { useState } from 'react';
import {
    ArrowLeft,
    ChevronDown,
    Plus
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 工具函数：合并Tailwind类名
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// 模拟下拉选择项数据
const mockOptions = {
    community: ['阳光花园', '丽景湾', '悦湖苑'],
    region: ['A区', 'B区', 'C区', '地下一层'],
    spotNo: ['A01', 'A02', 'B05', 'C12'],
    spotType: ['产权车位', '租赁车位', '临时车位']
};

const ParkingForm = () => {
    const [formData, setFormData] = useState({
        community: '',
        region: '',
        spotNo: '',
        spotType: '',
        userName: '',
        phone: '',
        licensePlate: '',
        attachment: null as File | null
    });

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setFormData(prev => ({ ...prev, attachment: file }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('提交表单:', formData);
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* 顶部导航栏 */}
            <header className="bg-blue-500 text-white h-14 flex items-center justify-between px-4 shadow-md">
                <button className="p-2 -ml-2 rounded-full hover:bg-blue-600 transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-semibold">添加车位</h1>
                <div className="w-10" />
            </header>

            {/* 表单主体 */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4 max-w-md mx-auto">
                {/* 车位信息模块 */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <span className="w-1 h-6 bg-blue-500 mr-2 rounded-full" />
                        车位信息
                    </h2>
                    <div className="space-y-4">
                        {[
                            { label: '小区', key: 'community' as const, options: mockOptions.community },
                            { label: '区域', key: 'region' as const, options: mockOptions.region },
                            { label: '车位编号', key: 'spotNo' as const, options: mockOptions.spotNo },
                            { label: '车位类型', key: 'spotType' as const, options: mockOptions.spotType }
                        ].map((item) => (
                            <div key={item.key} className="flex flex-col">
                                <label className="text-gray-700 font-medium mb-1 flex">
                                    {item.label} <span className="text-red-500 ml-1">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData[item.key]}
                                        onChange={(e) => handleInputChange(item.key, e.target.value)}
                                        className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none"
                                        required
                                    >
                                        <option value="" disabled>请选择</option>
                                        {item.options.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 住户信息模块 */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <span className="w-1 h-6 bg-blue-500 mr-2 rounded-full" />
                        住户信息
                    </h2>
                    <div className="space-y-4">
                        {[
                            { label: '姓名', key: 'userName' as const, placeholder: '请输入内容', type: 'text' },
                            { label: '手机号', key: 'phone' as const, placeholder: '请输入内容', type: 'tel' }
                        ].map((item) => (
                            <div key={item.key} className="flex flex-col">
                                <label className="text-gray-700 font-medium mb-1 flex">
                                    {item.label} <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type={item.type}
                                    value={formData[item.key]}
                                    onChange={(e) => handleInputChange(item.key, e.target.value)}
                                    placeholder={item.placeholder}
                                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    required
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* 车辆信息模块 */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <span className="w-1 h-6 bg-blue-500 mr-2 rounded-full" />
                        车辆信息(非必填)
                    </h2>
                    <div className="space-y-4">
                        <div className="flex flex-col">
                            <label className="text-gray-700 font-medium mb-1">车牌号</label>
                            <input
                                type="text"
                                value={formData.licensePlate}
                                onChange={(e) => handleInputChange('licensePlate', e.target.value)}
                                placeholder="请输入内容"
                                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="text-gray-700 font-medium mb-1">上传证件照片</label>
                            <label className="w-36 h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                                <Plus className="w-8 h-8 text-gray-400 mb-1" />
                                <span className="text-sm text-gray-500">选择图片</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                            {formData.attachment && (
                                <p className="text-xs text-green-600 mt-1">
                                    已选择: {formData.attachment.name}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 提交按钮 */}
                <button
                    type="submit"
                    className="w-full h-12 bg-blue-500 text-white rounded-lg font-semibold text-lg hover:bg-blue-600 transition-colors shadow-sm"
                >
                    提交
                </button>
            </form>
        </div>
    );
};

export default ParkingForm;